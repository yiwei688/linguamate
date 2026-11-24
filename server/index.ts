// 最小的 HTTP 服务：只用 node:http，不装 Express。
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { db, hashPassword, seedIfEmpty, verifyPassword } from './db.ts'

const PORT = 8787

seedIfEmpty()

function send(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

type PartnerRow = { name: string; level: string; tags: string; color: string }

const LEVEL_RANK: Record<string, number> = { A2: 1, B1: 2, B2: 3 }

function matchPartners(mode: string, myTags: string[], myLevel: string) {
  const rows = db.prepare('SELECT name, level, tags, color FROM partners').all() as PartnerRow[]
  const scored = rows.map((r) => {
    const tags = r.tags.split(',').filter(Boolean)
    const shared = tags.filter((t) => myTags.includes(t))
    const diff = tags.filter((t) => !myTags.includes(t))
    return { name: r.name, level: r.level, color: r.color, tags, shared, diff }
  })

  const list = scored.filter((p) => {
    if (mode === 'chill') return p.shared.length > 0
    // 进阶：标签没交集，或者等级比我高
    return p.diff.length > 0
      ? p.diff.length === p.tags.length || (LEVEL_RANK[p.level] ?? 0) > (LEVEL_RANK[myLevel] ?? 0)
      : (LEVEL_RANK[p.level] ?? 0) > (LEVEL_RANK[myLevel] ?? 0)
  })

  return list
}

const PAGE_SIZE = 4

/** 当前在某个模式里的真人（自己要能出现在别人的列表里，但不出现在自己的列表里） */
function realPartners(mode: string, me: string, myTags: string[], myLevel: string) {
  const now = Date.now()
  const seen = new Map<string, { account: string; level: string }>()
  for (const p of online.values()) {
    if (now - p.lastSeen > PRESENCE_TTL) continue
    if (p.mode !== mode) continue
    if (p.account === me) continue
    seen.set(p.account, { account: p.account, level: p.level })
  }

  return [...seen.values()].map((u) => {
    const row = db.prepare('SELECT tags FROM users WHERE account = ?').get(u.account) as
      | { tags: string }
      | undefined
    const tags = (row?.tags ?? '').split(',').filter(Boolean)
    const shared = tags.filter((t) => myTags.includes(t))
    const diff = tags.filter((t) => !myTags.includes(t))
    return {
      name: u.account,
      level: u.level,
      color: '#12b3a6',
      tags,
      shared,
      diff,
      online: true,
    }
  })
}

/* ---------------- 房间与信令（只存在内存里，进程重启就清空） ---------------- */

type Member = { clientId: string; account: string }

type SignalMessage = { seq: number; from: string; kind: string; data: unknown }

type Room = {
  id: string
  partner: string
  mode: string
  tags: string[]
  host: Member
  guest: Member | null
  createdAt: number
  startedAt: number | null
  seq: number
  messages: SignalMessage[]
  recorded: boolean
}

const rooms = new Map<string, Room>()

function newRoomId(): string {
  let id = ''
  do {
    id = Math.random().toString(36).slice(2, 8).toUpperCase()
  } while (rooms.has(id))
  return id
}

function publicRoom(room: Room) {
  return {
    id: room.id,
    partner: room.partner,
    mode: room.mode,
    tags: room.tags,
    host: { account: room.host.account },
    guest: room.guest ? { account: room.guest.account } : null,
    startedAt: room.startedAt,
  }
}

/** 有人在房间结束练习时，服务端一次性给双方各写一条（不再依赖两边各自的页面） */
function recordSession(room: Room): void {
  if (room.recorded || !room.guest || !room.startedAt) return
  const minutes = Math.floor((Date.now() - room.startedAt) / 60000)
  if (minutes < 1) return // 不足 1 分钟不记
  room.recorded = true

  const tagsOf = (account: string): string => {
    const row = db.prepare('SELECT tags FROM users WHERE account = ?').get(account) as
      | { tags: string }
      | undefined
    return row?.tags ?? ''
  }
  const insert = db.prepare(
    'INSERT INTO practices (user_account, partner_name, minutes, created_at, mode, partner_tags) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const now = Date.now()
  insert.run(room.host.account, room.guest.account, minutes, now, room.mode, tagsOf(room.guest.account))
  insert.run(room.guest.account, room.host.account, minutes, now, room.mode, tagsOf(room.host.account))
}

/** 防止内存里堆死房间：超过 2 小时没人管的直接清掉 */
function pruneRooms(): void {
  const limit = 2 * 60 * 60 * 1000
  const now = Date.now()
  for (const [id, room] of rooms) {
    if (now - room.createdAt > limit) rooms.delete(id)
  }
}

/* ---------------- 真人排队（随机匹配） ---------------- */

type Waiter = { account: string; clientId: string; lastSeen: number }

const WAIT_TTL = 15000
const waitingByMode = new Map<string, Waiter[]>()
const pendingRoom = new Map<string, string>()

function freshWaiters(mode: string): Waiter[] {
  const now = Date.now()
  return (waitingByMode.get(mode) ?? []).filter((w) => now - w.lastSeen < WAIT_TTL)
}

/* ---------------- 在线状态与邀请 ---------------- */

type Presence = { account: string; level: string; mode: string | null; lastSeen: number }

type Invite = {
  id: string
  fromAccount: string
  fromClientId: string
  toAccount: string
  roomId: string
  createdAt: number
}

const PRESENCE_TTL = 12000
const online = new Map<string, Presence>()
const invites = new Map<string, Invite>()

function newInviteId(): string {
  let id = ''
  do {
    id = Math.random().toString(36).slice(2, 8).toUpperCase()
  } while (invites.has(id))
  return id
}

/** 在线列表 = 最近 12 秒内有过心跳、且不是我自己 */
function onlineOthers(myAccount: string): { account: string; level: string }[] {
  const now = Date.now()
  const seen = new Map<string, { account: string; level: string }>()
  for (const [clientId, p] of online) {
    if (now - p.lastSeen > PRESENCE_TTL) {
      online.delete(clientId)
      continue
    }
    if (p.account === myAccount) continue
    seen.set(p.account, { account: p.account, level: p.level })
  }
  return [...seen.values()]
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const path = url.pathname

  try {
    if (req.method === 'POST' && path === '/api/register') {
      const body = await readJson(req)
      const account = str(body.account)
      const password = str(body.password)
      const phone = str(body.phone)
      const email = str(body.email)

      if (!/^[A-Za-z0-9_]{2,20}$/.test(account)) return send(res, 400, { error: '账号要 2–20 位字母、数字或下划线' })
      if (password.length < 6) return send(res, 400, { error: '密码至少 6 位' })
      if (!/^1[3-9]\d{9}$/.test(phone)) return send(res, 400, { error: '手机号格式不对' })
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: '邮箱格式不对' })

      const exists = db.prepare('SELECT id FROM users WHERE account = ?').get(account)
      if (exists) return send(res, 409, { error: '该账号已被注册' })

      const { salt, hash } = hashPassword(password)
      db.prepare(
        'INSERT INTO users (account, pass_hash, pass_salt, phone, email, level, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(account, hash, salt, phone, email, 'B1', '', Date.now())

      return send(res, 201, { ok: true, user: { account, level: 'B1', tags: [], assessed: 0 } })
    }

    if (req.method === 'POST' && path === '/api/level') {
      const body = await readJson(req)
      const account = str(body.account)
      if (!account) return send(res, 400, { error: '缺少 account' })
      if (!db.prepare('SELECT account FROM users WHERE account = ?').get(account)) {
        return send(res, 404, { error: '账号不存在' })
      }

      const INTEREST = ['电影迷', '科技控', '旅行党', '社会派']
      const SOCIAL = ['破冰者', '慢热型', '倾听者']
      const RHYTHM = ['短平快', '深聊派']

      // 兴趣可以多选，也允许自己写（最多 4 个，每个不超过 12 个字）
      const rawInterests = Array.isArray(body.interests) ? body.interests : []
      const interests = [
        ...new Set(
          rawInterests
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && t.length <= 12),
        ),
      ].slice(0, 4)

      const socialRaw = str(body.social)
      const rhythmRaw = str(body.rhythm)
      const social = SOCIAL.includes(socialRaw) || (socialRaw.length > 0 && socialRaw.length <= 12) ? socialRaw : ''
      const rhythm = RHYTHM.includes(rhythmRaw) || (rhythmRaw.length > 0 && rhythmRaw.length <= 12) ? rhythmRaw : ''
      const selfDesc = str(body.selfDesc).slice(0, 40)

      const tags = [...interests, social, rhythm].filter(Boolean)
      if (tags.length === 0) return send(res, 400, { error: '至少回答一道题' })

      // 假评分：只看说了多久、中间停顿几次。以后接 ASR + 大模型时替换这一段，前端不用改。
      const seconds = Math.max(0, Math.min(120, Number(body.seconds) || 0))
      const pauses = Math.max(0, Math.min(60, Number(body.pauses) || 0))
      const score = Math.round(Math.max(20, Math.min(95, 30 + (seconds / 60) * 50 - pauses * 3)))
      const level = score >= 78 ? 'B2' : score >= 58 ? 'B1' : 'A2'

      db.prepare('UPDATE users SET level = ?, tags = ?, assessed = 1, self_desc = ? WHERE account = ?').run(
        level,
        tags.join(','),
        selfDesc,
        account,
      )

      return send(res, 200, {
        ok: true,
        level,
        tags,
        scores: {
          flow: score,
          vocab: Math.max(20, score - 5),
          grammar: Math.max(20, score - 9),
          initiative: Math.max(20, score - 2),
        },
      })
    }

    if (req.method === 'POST' && path === '/api/login') {
      const body = await readJson(req)
      const account = str(body.account)
      const password = str(body.password)

      const row = db.prepare('SELECT * FROM users WHERE account = ?').get(account) as
        | { account: string; pass_hash: string; pass_salt: string; level: string; tags: string; assessed: number }
        | undefined

      if (!row || !verifyPassword(password, row.pass_salt, row.pass_hash)) {
        return send(res, 401, { error: '账号或密码错误' })
      }
      return send(res, 200, {
        ok: true,
        user: {
          account: row.account,
          level: row.level,
          tags: row.tags.split(',').filter(Boolean),
          assessed: row.assessed,
        },
      })
    }

    if (req.method === 'GET' && path === '/api/partners') {
      const mode = url.searchParams.get('mode') ?? 'chill'
      const myTags = (url.searchParams.get('tags') ?? '').split(',').filter(Boolean)
      const myLevel = url.searchParams.get('level') ?? 'B1'
      const me = url.searchParams.get('account') ?? ''
      const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0) || 0)

      const real = realPartners(mode, me, myTags, myLevel)
      const fake = matchPartners(mode, myTags, myLevel)
      const start = fake.length ? offset % fake.length : 0
      const fakePage = [...fake.slice(start), ...fake.slice(0, start)].slice(0, PAGE_SIZE)

      // 真人固定排最前，示例语伴在后面轮换
      return send(res, 200, {
        ok: true,
        partners: [...real.slice(0, PAGE_SIZE), ...fakePage],
        total: fake.length,
        realCount: Math.min(real.length, PAGE_SIZE),
      })
    }

    if (req.method === 'GET' && path === '/api/practices') {
      const account = url.searchParams.get('account') ?? ''
      const rows = db
        .prepare('SELECT partner_name, minutes, created_at FROM practices WHERE user_account = ? ORDER BY created_at DESC')
        .all(account)
      return send(res, 200, { ok: true, practices: rows })
    }

    if (req.method === 'POST' && path === '/api/practices') {
      const body = await readJson(req)
      const account = str(body.account)
      const partnerAccount = str(body.partnerAccount)
      let partner = str(body.partner) || 'AI 语伴'
      let tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : []
      const minutes = Number(body.minutes) || 1
      const mode = body.mode === 'stretch' ? 'stretch' : 'chill'
      if (!account) return send(res, 400, { error: '缺少 account' })

      // 有对方账号就直接查库拿名字和标签，前端不用自己拼
      if (partnerAccount) {
        const mate = db.prepare('SELECT account, tags FROM users WHERE account = ?').get(partnerAccount) as
          | { account: string; tags: string }
          | undefined
        if (mate) {
          partner = mate.account
          tags = mate.tags.split(',').filter(Boolean)
        }
      }

      db.prepare(
        'INSERT INTO practices (user_account, partner_name, minutes, created_at, mode, partner_tags) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(account, partner, Math.max(1, Math.min(120, minutes)), Date.now(), mode, tags.join(','))
      return send(res, 201, { ok: true })
    }

    if (req.method === 'GET' && path === '/api/profile') {
      const account = url.searchParams.get('account') ?? ''

      const user = db.prepare('SELECT account, level, tags FROM users WHERE account = ?').get(account) as
        | { account: string; level: string; tags: string }
        | undefined
      if (!user) return send(res, 404, { error: '账号不存在' })

      const rows = db
        .prepare(
          'SELECT partner_name, minutes, created_at, mode, partner_tags FROM practices WHERE user_account = ? ORDER BY created_at DESC LIMIT 20',
        )
        .all(account) as {
        partner_name: string
        minutes: number
        created_at: number
        mode: string | null
        partner_tags: string | null
      }[]

      /* 成长图谱与徽章：用全部记录算，不是只算最近 20 条 */
      const all = db
        .prepare('SELECT partner_name, minutes, created_at, mode, partner_tags FROM practices WHERE user_account = ?')
        .all(account) as { partner_name: string; minutes: number; created_at: number; mode: string | null; partner_tags: string | null }[]

      const topicMinutes = new Map<string, number>()
      // 社交偏好标签不是"话题"，不进话题分布
      const SOCIAL_TAGS = new Set(['破冰者', '慢热型', '倾听者', '深聊派'])
      for (const r of all) {
        for (const tag of (r.partner_tags ?? '').split(',').filter(Boolean)) {
          if (SOCIAL_TAGS.has(tag)) continue
          topicMinutes.set(tag, (topicMinutes.get(tag) ?? 0) + r.minutes)
        }
      }
      const topics = [...topicMinutes.entries()]
        .map(([tag, minutes]) => ({ tag, minutes }))
        .sort((a, b) => b.minutes - a.minutes)

      const sessions = all.length
      const totalMinutes = all.reduce((s, r) => s + r.minutes, 0)
      const maxMinutes = all.reduce((m, r) => Math.max(m, r.minutes), 0)
      const hasStretch = all.some((r) => r.mode === 'stretch')
      const partnerCount = new Set(all.map((r) => r.partner_name)).size

      const days = [...new Set(all.map((r) => new Date(Number(r.created_at)).toISOString().slice(0, 10)))]
        .sort()
        .reverse()
      let streak = days.length ? 1 : 0
      for (let i = 1; i < days.length; i++) {
        const a = new Date(`${days[i - 1]}T00:00:00Z`).getTime()
        const b = new Date(`${days[i]}T00:00:00Z`).getTime()
        if (a - b === 86400000) streak++
        else break
      }

      const badges = [
        { id: 'first', title: '第一次开口', unlocked: sessions >= 1 },
        { id: 'streak5', title: '连续 5 天', unlocked: streak >= 5 },
        { id: 'ten', title: '10 分钟不冷场', unlocked: maxMinutes >= 10 },
        { id: 'stretch', title: '完成进阶挑战', unlocked: hasStretch },
        { id: 'min300', title: '累计 300 分钟', unlocked: totalMinutes >= 300 },
        { id: 'friends3', title: '交到 3 个语伴', unlocked: partnerCount >= 3 },
        { id: 'b2', title: '等级升到 B2', unlocked: user.level === 'B2' },
        // 需要"回看对话"这个行为才能算，先固定未解锁
        { id: 'review20', title: '回看 20 次', unlocked: false },
      ]

      return send(res, 200, {
        ok: true,
        user: { account: user.account, level: user.level, tags: user.tags.split(',').filter(Boolean) },
        stats: { totalMinutes, sessions },
        recent: rows.map((r) => ({
          partner: r.partner_name,
          minutes: r.minutes,
          at: r.created_at,
          mode: r.mode,
          tags: (r.partner_tags ?? '').split(',').filter(Boolean),
        })),
        topics,
        badges,
      })
    }

    if (req.method === 'POST' && path === '/api/room/invite') {
      pruneRooms()
      const body = await readJson(req)
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!account || !clientId) return send(res, 400, { error: '缺少 account 或 clientId' })

      const room: Room = {
        id: newRoomId(),
        partner: str(body.partner) || '语伴',
        mode: body.mode === 'stretch' ? 'stretch' : 'chill',
        tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [],
        host: { clientId, account },
        guest: null,
        createdAt: Date.now(),
        startedAt: null,
        seq: 0,
        messages: [],
        recorded: false,
      }
      rooms.set(room.id, room)
      return send(res, 201, { ok: true, roomId: room.id })
    }

    if (req.method === 'POST' && path === '/api/room/join') {
      const body = await readJson(req)
      const room = rooms.get(str(body.roomId).toUpperCase())
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!room) return send(res, 404, { error: '房间不存在或已结束' })
      if (!account || !clientId) return send(res, 400, { error: '缺少 account 或 clientId' })
      if (room.host.clientId === clientId) return send(res, 200, { ok: true, room: publicRoom(room) })
      if (room.guest && room.guest.clientId !== clientId) return send(res, 409, { error: '这个房间已经满了' })
      room.guest = { clientId, account }
      room.startedAt = Date.now()
      room.recorded = false
      return send(res, 200, { ok: true, room: publicRoom(room) })
    }

    if (req.method === 'GET' && path === '/api/room/state') {
      const room = rooms.get((url.searchParams.get('roomId') ?? '').toUpperCase())
      if (!room) return send(res, 404, { error: '房间不存在或已结束' })
      const cid = url.searchParams.get('clientId') ?? ''
      const role = room.host.clientId === cid ? 'host' : room.guest?.clientId === cid ? 'guest' : 'none'
      return send(res, 200, { ok: true, room: publicRoom(room), role })
    }

    if (req.method === 'POST' && path === '/api/room/leave') {
      const body = await readJson(req)
      const room = rooms.get(str(body.roomId).toUpperCase())
      if (!room) return send(res, 200, { ok: true })
      const clientId = str(body.clientId)
      if (room.host.clientId === clientId) {
        recordSession(room)
        rooms.delete(room.id)
      } else if (room.guest && room.guest.clientId === clientId) {
        recordSession(room)
        room.guest = null
        room.startedAt = null
      }
      return send(res, 200, { ok: true })
    }

    if (req.method === 'POST' && path === '/api/signal') {
      const body = await readJson(req)
      const room = rooms.get(str(body.roomId).toUpperCase())
      if (!room) return send(res, 404, { error: '房间不存在' })
      room.seq += 1
      room.messages.push({ seq: room.seq, from: str(body.from), kind: str(body.kind), data: body.data })
      if (room.messages.length > 500) room.messages.splice(0, room.messages.length - 500)
      return send(res, 200, { ok: true, seq: room.seq })
    }

    if (req.method === 'GET' && path === '/api/signal') {
      const room = rooms.get((url.searchParams.get('roomId') ?? '').toUpperCase())
      if (!room) return send(res, 404, { error: '房间不存在' })
      const since = Number(url.searchParams.get('since') ?? 0) || 0
      return send(res, 200, {
        ok: true,
        seq: room.seq,
        messages: room.messages.filter((m) => m.seq > since),
      })
    }

    if (req.method === 'POST' && path === '/api/queue') {
      const body = await readJson(req)
      const mode = body.mode === 'stretch' ? 'stretch' : 'chill'
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!account || !clientId) return send(res, 400, { error: '缺少 account 或 clientId' })

      // 已经配上房间了？下次轮询直接把房间号给他
      const paired = pendingRoom.get(clientId)
      if (paired) {
        if (rooms.has(paired)) return send(res, 200, { ok: true, roomId: paired })
        pendingRoom.delete(clientId)
      }

      const others = freshWaiters(mode).filter((w) => w.clientId !== clientId)
      const partner = others[0]

      if (partner) {
        const room: Room = {
          id: newRoomId(),
          partner: account,
          mode,
          tags: [],
          host: { clientId: partner.clientId, account: partner.account },
          guest: { clientId, account },
          createdAt: Date.now(),
          startedAt: Date.now(),
          seq: 0,
          messages: [],
          recorded: false,
        }
        rooms.set(room.id, room)
        pendingRoom.set(partner.clientId, room.id)
        pendingRoom.set(clientId, room.id)
        waitingByMode.set(mode, others.slice(1))
        return send(res, 200, { ok: true, roomId: room.id })
      }

      const me: Waiter = { account, clientId, lastSeen: Date.now() }
      waitingByMode.set(mode, [...others, me])
      return send(res, 200, { ok: true, waiting: true })
    }

    if (req.method === 'POST' && path === '/api/queue/leave') {
      const body = await readJson(req)
      const mode = body.mode === 'stretch' ? 'stretch' : 'chill'
      const clientId = str(body.clientId)
      waitingByMode.set(mode, freshWaiters(mode).filter((w) => w.clientId !== clientId))
      pendingRoom.delete(clientId)
      return send(res, 200, { ok: true })
    }

    if (req.method === 'POST' && path === '/api/presence') {
      const body = await readJson(req)
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!account || !clientId) return send(res, 400, { error: '缺少 account 或 clientId' })
      const row = db.prepare('SELECT level FROM users WHERE account = ?').get(account) as { level: string } | undefined
      const mode = body.mode === 'chill' || body.mode === 'stretch' ? body.mode : null
      online.set(clientId, { account, level: row?.level ?? 'B1', mode, lastSeen: Date.now() })
      return send(res, 200, { ok: true, online: onlineOthers(account) })
    }

    if (req.method === 'POST' && path === '/api/invite') {
      const body = await readJson(req)
      const fromAccount = str(body.fromAccount)
      const fromClientId = str(body.fromClientId)
      const toAccount = str(body.toAccount)
      const mode = body.mode === 'stretch' ? 'stretch' : 'chill'
      if (!fromAccount || !fromClientId || !toAccount) return send(res, 400, { error: '缺少参数' })

      const room: Room = {
        id: newRoomId(),
        partner: toAccount,
        mode,
        tags: [],
        host: { clientId: fromClientId, account: fromAccount },
        guest: null,
        createdAt: Date.now(),
        startedAt: null,
        seq: 0,
        messages: [],
        recorded: false,
      }
      rooms.set(room.id, room)

      const invite: Invite = {
        id: newInviteId(),
        fromAccount,
        fromClientId,
        toAccount,
        roomId: room.id,
        createdAt: Date.now(),
      }
      invites.set(invite.id, invite)
      return send(res, 201, { ok: true, roomId: room.id, inviteId: invite.id })
    }

    if (req.method === 'GET' && path === '/api/invites') {
      const account = url.searchParams.get('account') ?? ''
      const list = [...invites.values()]
        .filter((i) => i.toAccount === account)
        .filter((i) => {
          const room = rooms.get(i.roomId)
          return Boolean(room && !room.guest)
        })
        .map((i) => {
          const from = db.prepare('SELECT tags FROM users WHERE account = ?').get(i.fromAccount) as
            | { tags: string }
            | undefined
          return {
            id: i.id,
            from: i.fromAccount,
            roomId: i.roomId,
            mode: rooms.get(i.roomId)?.mode ?? 'chill',
            tags: (from?.tags ?? '').split(',').filter(Boolean),
          }
        })
      return send(res, 200, { ok: true, invites: list })
    }

    if (req.method === 'POST' && path === '/api/invite/respond') {
      const body = await readJson(req)
      const invite = invites.get(str(body.inviteId).toUpperCase())
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!invite || invite.toAccount !== account) return send(res, 404, { error: '邀请已失效' })

      if (body.accept !== true) {
        invites.delete(invite.id)
        return send(res, 200, { ok: true, accepted: false })
      }

      const room = rooms.get(invite.roomId)
      if (!room) {
        invites.delete(invite.id)
        return send(res, 404, { error: '房间已结束' })
      }
      room.guest = { clientId, account }
      room.startedAt = Date.now()
      room.recorded = false
      invites.delete(invite.id)
      return send(res, 200, { ok: true, accepted: true, roomId: room.id })
    }

    if (req.method === 'POST' && path === '/api/room/create') {
      const body = await readJson(req)
      const account = str(body.account)
      const clientId = str(body.clientId)
      if (!account || !clientId) return send(res, 400, { error: '缺少 account 或 clientId' })
      const room: Room = {
        id: newRoomId(),
        partner: '待加入',
        mode: body.mode === 'stretch' ? 'stretch' : 'chill',
        tags: [],
        host: { clientId, account },
        guest: null,
        createdAt: Date.now(),
        startedAt: null,
        seq: 0,
        messages: [],
        recorded: false,
      }
      rooms.set(room.id, room)
      return send(res, 201, { ok: true, roomId: room.id })
    }

    if (path === '/api/health') return send(res, 200, { ok: true })

    return send(res, 404, { error: '没有这个接口：' + path })
  } catch (err) {
    console.error('[api] 出错：', err)
    return send(res, 500, { error: '服务端出错，看终端日志' })
  }
})

server.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT} 就绪`)
})
