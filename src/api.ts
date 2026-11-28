// 前端唯一的"出网口"：所有和数据库打交道的请求都从这里走。
// 地址写 /api，开发时由 Vite 转发到 8787 端口（见 vite.config.ts），所以不会遇到跨域。

import { mockRequest } from './mock'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function request<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  // 静态演示模式（GitHub Pages）：不发请求，直接用浏览器里的假数据
  if (__STATIC_DEMO__) return mockRequest<T>(path, body)

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

export type SessionUser = { account: string; level: string; tags: string[]; assessed: number }

export type Partner = {
  name: string
  level: string
  color: string
  tags: string[]
  shared: string[]
  diff: string[]
  online?: boolean
  topic?: string
  sameTopic?: boolean
}

export type PracticeItem = {
  partner: string
  minutes: number
  at: number
  mode: 'chill' | 'stretch' | null
  tags: string[]
}

export type Profile = {
  user: { account: string; level: string; tags: string[] }
  stats: { totalMinutes: number; sessions: number }
  recent: PracticeItem[]
  topics: { tag: string; minutes: number }[]
  badges: { id: string; title: string; unlocked: boolean }[]
}

export type RoomPublic = {
  id: string
  partner: string
  mode: string
  topic: string
  tags: string[]
  host: { account: string }
  guest: { account: string } | null
  startedAt: number | null
}

export type SignalMessage = { seq: number; from: string; kind: string; data: unknown }

export const api = {
  register: (input: { account: string; password: string; phone: string; email: string }) =>
    request<{ ok: true; user: SessionUser }>('/register', input),

  login: (input: { account: string; password: string }) =>
    request<{ ok: true; user: SessionUser }>('/login', input),

  levelAssess: (input: { readingText: string; answers: string[]; passage: string }) =>
    request<{
      ok: true
      level: string
      grammar: number
      vocabulary: number
      coherence: number
      comment: string
    }>('/level/assess', input),

  level: (input: {
    account: string
    readingSeconds: number
    readingAccuracy: number | null
    readingWords: number
    answers: { seconds: number; words: number; pauses: number }[]
    interests: string[]
    social: string
    rhythm: string
    selfDesc: string
    assess?: { level: string; comment: string }
  }) =>
    request<{
      ok: true
      level: string
      tags: string[]
      comment: string
      scores: {
        accuracy: number | null
        fluency: number
        rate: number
        completion: number
        overall: number
      }
    }>('/level', input),

  partners: (account: string, mode: string, tags: string[], level: string, offset = 0, topic = '') =>
    request<{ ok: true; partners: Partner[]; total: number; realCount: number }>(
      `/partners?mode=${encodeURIComponent(mode)}&tags=${encodeURIComponent(tags.join(','))}&level=${encodeURIComponent(level)}&offset=${offset}&account=${encodeURIComponent(account)}&topic=${encodeURIComponent(topic)}`,
    ),

  practices: (account: string) =>
    request<{ ok: true; practices: { partner_name: string; minutes: number; created_at: number }[] }>(
      `/practices?account=${encodeURIComponent(account)}`,
    ),

  addPractice: (input: {
    account: string
    partnerAccount?: string
    partner?: string
    minutes: number
    mode?: string
    tags?: string[]
  }) => request<{ ok: true }>('/practices', input),

  profile: (account: string) =>
    request<{ ok: true } & Profile>(`/profile?account=${encodeURIComponent(account)}`),

  roomInvite: (input: { account: string; partner: string; mode: string; tags: string[]; clientId: string }) =>
    request<{ ok: true; roomId: string }>('/room/invite', input),

  roomJoin: (input: { roomId: string; account: string; clientId: string }) =>
    request<{ ok: true; room: RoomPublic }>('/room/join', input),

  roomState: (roomId: string, clientId: string) =>
    request<{ ok: true; room: RoomPublic; role: 'host' | 'guest' | 'none' }>(
      `/room/state?roomId=${encodeURIComponent(roomId)}&clientId=${encodeURIComponent(clientId)}`,
    ),

  roomLeave: (input: { roomId: string; clientId: string }) => request<{ ok: true }>('/room/leave', input),

  queueJoin: (input: { mode: string; account: string; clientId: string }) =>
    request<{ ok: true; roomId?: string; waiting?: boolean }>('/queue', input),

  queueLeave: (input: { mode: string; clientId: string }) => request<{ ok: true }>('/queue/leave', input),

  presence: (input: { account: string; clientId: string; mode: 'chill' | 'stretch' | null; topic?: string }) =>
    request<{ ok: true; online: { account: string; level: string }[] }>('/presence', input),

  inviteSend: (input: {
    fromAccount: string
    fromClientId: string
    toAccount: string
    mode: string
    topic?: string
  }) => request<{ ok: true; roomId: string; inviteId: string }>('/invite', input),

  invites: (account: string) =>
    request<{ ok: true; invites: { id: string; from: string; roomId: string; mode: string; tags: string[] }[] }>(
      `/invites?account=${encodeURIComponent(account)}`,
    ),

  inviteRespond: (input: { inviteId: string; account: string; clientId: string; accept: boolean }) =>
    request<{ ok: true; accepted: boolean; roomId?: string }>('/invite/respond', input),

  roomCreate: (input: { account: string; clientId: string; mode?: string; topic?: string }) =>
    request<{ ok: true; roomId: string }>('/room/create', input),

  saveTranscript: (input: { account: string; roomId: string; mode: string; text: string }) =>
    request<{ ok: true }>('/transcript', input),

  aiStatus: () => request<{ ok: true; enabled: boolean }>('/ai/status'),

  aiSession: (input: { account: string; topic: string; mode: string; social: string }) =>
    request<{ ok: true; sessionId: string; greeting: string; persona: string; aiEnabled: boolean }>(
      '/ai/session',
      input,
    ),

  aiChat: (input: { sessionId: string; message: string }) =>
    request<{ ok: true; reply: string }>('/ai/chat', input),

  aiReview: (input: { sessionId?: string; topic: string; transcript: string }) =>
    request<{ ok: true; comment: string }>('/ai/review', input),

  signalSend: (input: { roomId: string; from: string; kind: string; data: unknown }) =>
    request<{ ok: true; seq: number }>('/signal', input),

  signalPoll: (roomId: string, since: number) =>
    request<{ ok: true; seq: number; messages: SignalMessage[] }>(
      `/signal?roomId=${encodeURIComponent(roomId)}&since=${since}`,
    ),
}
