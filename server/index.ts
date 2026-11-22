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

  return list.slice(0, 4)
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
      ).run(account, hash, salt, phone, email, 'B1', '电影迷,慢热型', Date.now())

      return send(res, 201, { ok: true, user: { account, level: 'B1', tags: ['电影迷', '慢热型'] } })
    }

    if (req.method === 'POST' && path === '/api/login') {
      const body = await readJson(req)
      const account = str(body.account)
      const password = str(body.password)

      const row = db.prepare('SELECT * FROM users WHERE account = ?').get(account) as
        | { account: string; pass_hash: string; pass_salt: string; level: string; tags: string }
        | undefined

      if (!row || !verifyPassword(password, row.pass_salt, row.pass_hash)) {
        return send(res, 401, { error: '账号或密码错误' })
      }
      return send(res, 200, {
        ok: true,
        user: { account: row.account, level: row.level, tags: row.tags.split(',').filter(Boolean) },
      })
    }

    if (req.method === 'GET' && path === '/api/partners') {
      const mode = url.searchParams.get('mode') ?? 'chill'
      const myTags = (url.searchParams.get('tags') ?? '').split(',').filter(Boolean)
      const myLevel = url.searchParams.get('level') ?? 'B1'
      return send(res, 200, { ok: true, partners: matchPartners(mode, myTags, myLevel) })
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
      const partner = str(body.partner) || 'AI 语伴'
      const minutes = Number(body.minutes) || 1
      if (!account) return send(res, 400, { error: '缺少 account' })
      db.prepare('INSERT INTO practices (user_account, partner_name, minutes, created_at) VALUES (?, ?, ?, ?)').run(
        account,
        partner,
        Math.max(1, Math.min(120, minutes)),
        Date.now(),
      )
      return send(res, 201, { ok: true })
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
