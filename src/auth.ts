// 现在"用户"存在数据库里（server/db.ts），这里只负责：
// 1) 调接口   2) 记住"当前是谁登录着"（这一条放浏览器本地就够）
import { api, type SessionUser } from './api'

export type Result = { ok: true } | { ok: false; msg: string }

const SESSION_KEY = 'linguamate.session'

export function currentUser(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

function setUser(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

/** 定级完成后刷新本地会话里的等级/标签，避免页面还显示旧的 */
export function updateSession(patch: Partial<SessionUser>): SessionUser | null {
  const current = currentUser()
  if (!current) return null
  const next = { ...current, ...patch }
  setUser(next)
  return next
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export async function register(input: {
  account: string
  password: string
  phone: string
  email: string
}): Promise<Result> {
  const res = await api.register(input)
  if (!res.ok) return { ok: false, msg: res.error }
  setUser(res.data.user)
  return { ok: true }
}

export async function login(account: string, password: string): Promise<Result> {
  const res = await api.login({ account, password })
  if (!res.ok) return { ok: false, msg: res.error }
  setUser(res.data.user)
  return { ok: true }
}
