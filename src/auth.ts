// 假的"后端"：把用户存在浏览器本地，给前端先把流程跑通。
// 阶段 4 会换成真正的 SQLite（node:sqlite）和加盐密码，这里的明文密码只为演示。

export type User = {
  account: string
  password: string
  phone: string
  email: string
  createdAt: number
}

export type Result = { ok: true } | { ok: false; msg: string }

const USERS_KEY = 'linguamate.users'
const SESSION_KEY = 'linguamate.session'

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function register(input: Omit<User, 'createdAt'>): Result {
  const users = readUsers()
  if (users.some((u) => u.account === input.account)) {
    return { ok: false, msg: '该账号已被注册' }
  }
  users.push({ ...input, createdAt: Date.now() })
  writeUsers(users)
  localStorage.setItem(SESSION_KEY, input.account)
  return { ok: true }
}

export function login(account: string, password: string): Result {
  const user = readUsers().find((u) => u.account === account)
  if (!user || user.password !== password) {
    return { ok: false, msg: '账号或密码错误' }
  }
  localStorage.setItem(SESSION_KEY, user.account)
  return { ok: true }
}

export function currentUser(): User | null {
  const account = localStorage.getItem(SESSION_KEY)
  if (!account) return null
  return readUsers().find((u) => u.account === account) ?? null
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}
