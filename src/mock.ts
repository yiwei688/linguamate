// 静态演示模式（GitHub Pages 用）：没有服务器，所有数据都在浏览器里造。
// 打包命令见 package.json 的 build:static，入口在 api.ts。
import type { ApiResult, Partner, Profile, PracticeItem } from './api'

type MockUser = { account: string; password: string; level: string; tags: string[]; assessed: number }

const users: MockUser[] = [
  { account: 'demo', password: '123456', level: 'B1', tags: ['电影迷', '慢热型'], assessed: 1 },
  { account: 'test', password: '123456', level: 'B2', tags: ['科技控', '破冰者'], assessed: 1 },
]

type FakePartner = { name: string; level: string; color: string; tags: string[] }

const PARTNERS: FakePartner[] = [
  { name: 'Mia', level: 'B1', color: '#7c6cf6', tags: ['电影迷', '倾听者'] },
  { name: 'Leo', level: 'B1', color: '#12b3a6', tags: ['科技控', '破冰者'] },
  { name: 'Sara', level: 'B2', color: '#ff6b4a', tags: ['社会派', '深聊派'] },
  { name: 'Ken', level: 'A2', color: '#f0a91b', tags: ['旅行党', '慢热型'] },
  { name: 'Ivy', level: 'B1', color: '#0ea5e9', tags: ['电影迷', '深聊派'] },
  { name: 'Noah', level: 'B2', color: '#8b5cf6', tags: ['科技控', '短平快'] },
  { name: 'Zoe', level: 'A2', color: '#ef4444', tags: ['旅行党', '破冰者'] },
  { name: 'Tom', level: 'B2', color: '#14b8a6', tags: ['社会派', '倾听者'] },
  { name: 'Lily', level: 'B1', color: '#d946ef', tags: ['读书人', '慢热型'] },
  { name: 'Owen', level: 'A2', color: '#64748b', tags: ['游戏党', '倾听者'] },
  { name: 'Emma', level: 'B1', color: '#f59e0b', tags: ['美食家', '破冰者'] },
  { name: 'Ryan', level: 'B2', color: '#3b82f6', tags: ['音乐虫', '深聊派'] },
]

const DAY = 86400000

function makePractices(account: string): PracticeItem[] {
  const out: PracticeItem[] = []
  for (let i = 0; i < 20; i++) {
    const p = PARTNERS[i % PARTNERS.length]
    const minutes = 4 + ((i * 3) % 11)
    out.push({
      partner: p.name,
      minutes,
      at: Date.now() - i * DAY - 3600000,
      mode: i % 3 === 0 ? 'stretch' : 'chill',
      tags: p.tags,
    })
  }
  return account === 'demo' ? out : out.slice(0, 4)
}

const practicesByUser = new Map<string, PracticeItem[]>([['demo', makePractices('demo')], ['test', makePractices('test')]])

const SOCIAL_TAGS = new Set(['破冰者', '慢热型', '倾听者', '深聊派'])

function buildProfile(account: string): ApiResult<Profile> {
  const user = users.find((u) => u.account === account)
  if (!user) return { ok: false, error: '账号不存在' }
  const all = practicesByUser.get(account) ?? []

  const topicMinutes = new Map<string, number>()
  for (const r of all) {
    for (const tag of r.tags) {
      if (SOCIAL_TAGS.has(tag)) continue
      topicMinutes.set(tag, (topicMinutes.get(tag) ?? 0) + r.minutes)
    }
  }
  const topics = [...topicMinutes.entries()]
    .map(([tag, minutes]) => ({ tag, minutes }))
    .sort((a, b) => b.minutes - a.minutes)

  const totalMinutes = all.reduce((s, r) => s + r.minutes, 0)
  const maxMinutes = all.reduce((m, r) => Math.max(m, r.minutes), 0)
  const partners = new Set(all.map((r) => r.partner)).size
  const days = [...new Set(all.map((r) => new Date(r.at).toISOString().slice(0, 10)))].sort().reverse()
  let streak = days.length ? 1 : 0
  for (let i = 1; i < days.length; i++) {
    const a = new Date(`${days[i - 1]}T00:00:00Z`).getTime()
    const b = new Date(`${days[i]}T00:00:00Z`).getTime()
    if (a - b === DAY) streak++
    else break
  }

  return {
    ok: true,
    data: {
      user: { account: user.account, level: user.level, tags: user.tags },
      stats: { totalMinutes, sessions: all.length },
      recent: all.slice(0, 20),
      topics,
      badges: [
        { id: 'first', title: '第一次开口', unlocked: all.length >= 1 },
        { id: 'streak5', title: '连续 5 天', unlocked: streak >= 5 },
        { id: 'ten', title: '10 分钟不冷场', unlocked: maxMinutes >= 10 },
        { id: 'stretch', title: '完成进阶挑战', unlocked: all.some((r) => r.mode === 'stretch') },
        { id: 'min300', title: '累计 300 分钟', unlocked: totalMinutes >= 300 },
        { id: 'friends3', title: '交到 3 个语伴', unlocked: partners >= 3 },
        { id: 'b2', title: '等级升到 B2', unlocked: user.level === 'B2' },
        { id: 'review20', title: '回看 20 次', unlocked: false },
      ],
    },
  }
}

const LEVEL_RANK: Record<string, number> = { A2: 1, B1: 2, B2: 3 }
const PAGE_SIZE = 4

function matchPartners(mode: string, myTags: string[], myLevel: string): Partner[] {
  return PARTNERS.map((p) => ({
    name: p.name,
    level: p.level,
    color: p.color,
    tags: p.tags,
    shared: p.tags.filter((t) => myTags.includes(t)),
    diff: p.tags.filter((t) => !myTags.includes(t)),
    online: false,
  })).filter((p) => {
    if (mode === 'chill') return p.shared.length > 0
    return p.diff.length === p.tags.length || (LEVEL_RANK[p.level] ?? 0) > (LEVEL_RANK[myLevel] ?? 0)
  })
}

/** 所有 api.xxx 最终都走到这里：按路径分派到假数据 */
export async function mockRequest<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  const [route, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  const payload = (body ?? {}) as Record<string, unknown>

  if (route === '/login') {
    const account = String(payload.account ?? '')
    const password = String(payload.password ?? '')
    const user = users.find((u) => u.account === account)
    if (!user || user.password !== password) return { ok: false, error: '账号或密码错误（演示账号 demo / 123456）' }
    return {
      ok: true,
      data: {
        ok: true,
        user: { account: user.account, level: user.level, tags: user.tags, assessed: user.assessed },
      } as unknown as T,
    }
  }

  if (route === '/level') {
    const account = String(payload.account ?? '')
    const user = users.find((u) => u.account === account)
    if (!user) return { ok: false, error: '账号不存在' }

    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
    const accuracy =
      typeof payload.readingAccuracy === 'number' ? Math.round(clamp(payload.readingAccuracy, 0, 100)) : null

    const rawAnswers = Array.isArray(payload.answers) ? payload.answers : []
    const list = rawAnswers.slice(0, 4).map((a) => {
      const item = (a ?? {}) as Record<string, unknown>
      return { seconds: num(item.seconds), words: num(item.words), pauses: num(item.pauses) }
    })
    const totalSec = list.reduce((s, a) => s + a.seconds, 0)
    const totalWords = list.reduce((s, a) => s + a.words, 0)
    const totalPauses = list.reduce((s, a) => s + a.pauses, 0)
    const minutes = totalSec / 60
    const ppm = minutes > 0 ? totalPauses / minutes : 12
    const wpm = minutes > 0 ? totalWords / minutes : 0

    const fluency = Math.round(clamp(100 - ppm * 8, 20, 95))
    const rate = Math.round(clamp(wpm / 1.5, 20, 95))
    const answered = list.filter((a) => a.seconds >= 8).length
    const completion = list.length === 0 ? 30 : Math.round(30 + (answered / list.length) * 70)
    const overall =
      accuracy === null
        ? Math.round(fluency * 0.4 + rate * 0.3 + completion * 0.3)
        : Math.round(accuracy * 0.35 + fluency * 0.25 + rate * 0.2 + completion * 0.2)
    const level = overall >= 80 ? 'B2' : overall >= 55 ? 'B1' : 'A2'

    const interests = Array.isArray(payload.interests)
      ? payload.interests.filter((t): t is string => typeof t === 'string' && t.length > 0)
      : []
    const tags = [...interests, payload.social, payload.rhythm].filter(
      (t): t is string => typeof t === 'string' && t.length > 0,
    )

    user.level = level
    user.tags = tags
    user.assessed = 1
    return {
      ok: true,
      data: { ok: true, level, tags, scores: { accuracy, fluency, rate, completion, overall } } as unknown as T,
    }
  }

  if (route === '/register') {
    const account = String(payload.account ?? '')
    if (users.some((u) => u.account === account)) return { ok: false, error: '该账号已被注册（演示模式只存在浏览器里）' }
    const user: MockUser = { account, password: String(payload.password ?? ''), level: 'B1', tags: [], assessed: 0 }
    users.push(user)
    practicesByUser.set(account, [])
    return {
      ok: true,
      data: { ok: true, user: { account, level: user.level, tags: user.tags, assessed: 0 } } as unknown as T,
    }
  }

  if (route === '/partners') {
    const mode = params.get('mode') ?? 'chill'
    const myTags = (params.get('tags') ?? '').split(',').filter(Boolean)
    const myLevel = params.get('level') ?? 'B1'
    const offset = Number(params.get('offset') ?? 0) || 0
    const all = matchPartners(mode, myTags, myLevel)
    const start = all.length ? offset % all.length : 0
    const page = [...all.slice(start), ...all.slice(0, start)].slice(0, PAGE_SIZE)
    return { ok: true, data: { ok: true, partners: page, total: all.length, realCount: 0 } as unknown as T }
  }

  if (route === '/profile') return buildProfile(params.get('account') ?? '') as ApiResult<T>

  if (route === '/practices' && body === undefined) {
    const account = params.get('account') ?? ''
    const list = practicesByUser.get(account) ?? []
    return { ok: true, data: { ok: true, practices: list } as unknown as T }
  }

  return { ok: false, error: '静态演示模式：这个功能需要本地服务器（房间、语音、匹配队列）' }
}
