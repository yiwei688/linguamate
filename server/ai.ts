// DeepSeek 接入层。
// 有 key 就真的调模型；没 key 就退化成"规则版 AI"，界面和流程不受影响。
const API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export function aiEnabled(): boolean {
  return API_KEY.trim().length > 0
}

/** 社交偏好标签 → AI 人设 */
export function personaFor(socialTag: string): { name: string; system: string } {
  if (socialTag.includes('破冰')) {
    return {
      name: 'Mia',
      system:
        'You are Mia, a cheerful and outgoing English-speaking partner. You open topics quickly, ask lively follow-up questions, and keep your replies to one or two short sentences plus one question. Never switch to Chinese.',
    }
  }
  if (socialTag.includes('倾听')) {
    return {
      name: 'Ivy',
      system:
        'You are Ivy, a patient listener and English-speaking partner. You reflect back what you heard before asking a gentle follow-up. Keep replies to one or two short sentences plus one question. Never switch to Chinese.',
    }
  }
  return {
    name: 'Leo',
    system:
      'You are Leo, a calm and friendly English-speaking partner. You speak slowly and simply, give the learner time, and ask one easy follow-up question. Keep replies to one or two short sentences. Never switch to Chinese.',
  }
}

export function greetingFor(topic: string, persona: { name: string }): string {
  return `Hi! I'm ${persona.name}. Let's talk about "${topic}". ${openingQuestion(topic)}`
}

function openingQuestion(topic: string): string {
  if (topic.includes('旅行')) return 'Where did you go last time?'
  if (topic.includes('剧')) return 'What are you watching these days?'
  if (topic.includes('菜')) return 'What can you cook well?'
  if (topic.includes('通勤')) return 'How do you get to work or school?'
  if (topic.includes('App')) return 'Which apps do you use the most?'
  if (topic.includes('学')) return 'What are you learning these days?'
  if (topic.includes('烦')) return 'What is the most annoying part of your week?'
  if (topic.includes('照片')) return 'Which photo would you never delete?'
  if (topic.includes('放假')) return 'What would you do with a free day?'
  return 'What do you usually do on a normal weekday?'
}

/** 没有 key 时的兜底回复：不联网、不花钱，但流程能跑通 */
function fallbackReply(userText: string): string {
  const words = userText.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 'Take your time — you can start with one sentence.'
  if (words <= 4) {
    return 'Got it. Can you say a little more about that? One more sentence is enough.'
  }
  const tails = [
    'That sounds interesting. What happened next?',
    'I see. How did you feel about it?',
    'Nice. Would you do it again?',
    'Interesting — what was the best part?',
  ]
  return `${tails[Math.floor(Math.random() * tails.length)]}`
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  if (!aiEnabled()) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    return fallbackReply(lastUser?.content ?? '')
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 200,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`DeepSeek 返回 ${res.status}${detail ? `：${detail.slice(0, 120)}` : ''}`)
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('DeepSeek 返回了空内容')
  return text
}

export type LevelAssessment = {
  level: 'A2' | 'B1' | 'B2'
  grammar: number
  vocabulary: number
  coherence: number
  comment: string
}

/**
 * 用模型给"朗读 + 两个回答"的转写打分。
 * 没有 key 或调用失败时抛错，调用方退回规则分。
 */
export async function assessLevel(input: {
  readingText: string
  answers: string[]
  passage: string
}): Promise<LevelAssessment> {
  if (!aiEnabled()) throw new Error('没有配置 DEEPSEEK_API_KEY')

  const system = `You are a certified English speaking examiner.
Judge ONLY from the transcript of the learner's recognised speech (it may contain recognition errors; ignore obvious mis-recognitions).
Return STRICT JSON with exactly these keys:
{"level":"A2|B1|B2","grammar":0-100,"vocabulary":0-100,"coherence":0-100,"comment":"一句中文点评，不超过40字"}
Rules: level must be one of A2, B1, B2. Scores are integers. The comment must be in Chinese and mention one strength and one improvement.`

  const user = `Passage the learner read aloud:
${input.passage}

Learner reading (recognised):
${input.readingText || '(nothing recognised)'}

Answers:
${input.answers.map((a, i) => `Q${i + 1}: ${a || '(nothing recognised)'}`).join('\n')}`

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`DeepSeek 返回 ${res.status}${detail ? `：${detail.slice(0, 120)}` : ''}`)
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(raw) as Record<string, unknown>

  const clamp = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50
  }
  const levelRaw = String(parsed.level ?? '').toUpperCase()
  const level: LevelAssessment['level'] = levelRaw === 'B2' || levelRaw === 'B1' ? levelRaw : 'A2'

  return {
    level,
    grammar: clamp(parsed.grammar),
    vocabulary: clamp(parsed.vocabulary),
    coherence: clamp(parsed.coherence),
    comment: String(parsed.comment ?? '').slice(0, 80),
  }
}

/** 一句话评语（练习结束后用）：有 key 走模型，没 key 用规则 */export async function review(transcript: string, topic: string): Promise<string> {
  const lines = transcript.split('\n').filter(Boolean).length
  if (!aiEnabled()) {
    return `这次围绕「${topic}」聊了 ${lines} 段。建议下次：多说一个具体细节、少用一个笼统形容词。`
  }
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an English speaking coach. Give feedback in Chinese, at most 60 characters, one concrete strength and one concrete improvement. No greeting, no lists.',
    },
    { role: 'user', content: `话题：${topic}\n对话记录：\n${transcript.slice(0, 3000)}` },
  ]
  return await chat(messages)
}
