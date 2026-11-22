// 前端唯一的"出网口"：所有和数据库打交道的请求都从这里走。
// 地址写 /api，开发时由 Vite 转发到 8787 端口（见 vite.config.ts），所以不会遇到跨域。

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function request<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch('/api' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      return { ok: false, error: typeof data.error === 'string' ? data.error : `请求失败（${res.status}）` }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, error: '连不上数据库服务（8787 端口没开？）' }
  }
}

export type SessionUser = { account: string; level: string; tags: string[] }

export type Partner = {
  name: string
  level: string
  color: string
  tags: string[]
  shared: string[]
  diff: string[]
}

export const api = {
  register: (input: { account: string; password: string; phone: string; email: string }) =>
    request<{ ok: true; user: SessionUser }>('/register', input),

  login: (input: { account: string; password: string }) =>
    request<{ ok: true; user: SessionUser }>('/login', input),

  partners: (mode: string, tags: string[], level: string, offset = 0) =>
    request<{ ok: true; partners: Partner[]; total: number }>(
      `/partners?mode=${encodeURIComponent(mode)}&tags=${encodeURIComponent(tags.join(','))}&level=${encodeURIComponent(level)}&offset=${offset}`,
    ),

  practices: (account: string) =>
    request<{ ok: true; practices: { partner_name: string; minutes: number; created_at: number }[] }>(
      `/practices?account=${encodeURIComponent(account)}`,
    ),

  addPractice: (input: { account: string; partner: string; minutes: number }) =>
    request<{ ok: true }>('/practices', input),
}
