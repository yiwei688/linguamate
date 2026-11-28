import './ai.css'
import { api } from './api'
import { currentUser } from './auth'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

const STARTED_KEY = 'lm.ai.start'

type StartInfo = { mode: 'chill' | 'stretch'; topic: string }

function readStart(): StartInfo {
  try {
    const raw = sessionStorage.getItem(STARTED_KEY)
    if (raw) return JSON.parse(raw) as StartInfo
  } catch {
    // 忽略
  }
  return { mode: 'chill', topic: '最近一件让你开心的小事' }
}

export function aiView(): string {
  const me = currentUser()
  const start = readStart()
  return `<div class="ai-shell">
    <div class="ai-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions">
        <span class="muted">${start.topic}</span>
        <button class="link-quit" id="ai-end" type="button">结束练习</button>
      </div>
    </div>

    <div class="ai-card card">
      <div class="ai-head">
        <b id="ai-name">AI 语伴</b>
        <span class="muted" id="ai-status">正在连接…</span>
        <label class="ai-speak"><input type="checkbox" id="ai-tts" checked /> 朗读回复</label>
      </div>

      <div class="ai-stream" id="ai-stream"></div>

      <div class="ai-input">
        <input id="ai-text" placeholder="用英文说点什么，回车发送" autocomplete="off" />
        <button class="btn sm" id="ai-send" type="button">发送</button>
      </div>
      <p class="err" id="ai-err" hidden></p>
      <p class="ai-note" id="ai-note">${me ? '' : '未登录'}</p>
    </div>
  </div>`
}

export function mountAi(): void {
  const me = currentUser()
  if (!me) {
    location.hash = '#/login'
    return
  }

  const start = readStart()
  const stream = $<HTMLDivElement>('#ai-stream')
  const input = $<HTMLInputElement>('#ai-text')
  const sendBtn = $<HTMLButtonElement>('#ai-send')
  const err = $<HTMLParagraphElement>('#ai-err')
  const statusEl = $<HTMLSpanElement>('#ai-status')
  const nameEl = $<HTMLElement>('#ai-name')
  const ttsBox = $<HTMLInputElement>('#ai-tts')
  const noteEl = $<HTMLParagraphElement>('#ai-note')

  let sessionId = ''
  let persona = 'AI 语伴'
  const transcript: string[] = []

  /* ---------- 朗读（和房间同一套提速手法） ---------- */
  let preferredVoice: SpeechSynthesisVoice | null = null
  const pickVoice = (): void => {
    try {
      const english = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
      preferredVoice = english.find((v) => !/online|natural/i.test(v.name)) ?? english[0] ?? null
    } catch {
      preferredVoice = null
    }
  }
  const speak = (text: string): void => {
    if (!ttsBox.checked) return
    try {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.92
      if (preferredVoice) u.voice = preferredVoice
      window.setTimeout(() => {
        try {
          speechSynthesis.speak(u)
        } catch {
          // 忽略
        }
      }, 20)
    } catch {
      // 忽略
    }
  }
  pickVoice()
  try {
    speechSynthesis.onvoiceschanged = pickVoice
    const warm = new SpeechSynthesisUtterance(' ')
    warm.volume = 0
    speechSynthesis.speak(warm)
    window.setTimeout(() => speechSynthesis.cancel(), 30)
  } catch {
    // 忽略
  }

  const addRow = (text: string, self: boolean): void => {
    const row = document.createElement('div')
    row.className = `ai-msg ${self ? 'self' : ''}`
    row.innerHTML = `<div class="ai-bub">${text}</div>`
    stream.appendChild(row)
    stream.scrollTop = stream.scrollHeight
    transcript.push(`${self ? '我' : persona}：${text}`)
  }

  const showNote = (text: string): void => {
    noteEl.textContent = text
  }

  const startSession = async (): Promise<void> => {
    const social = me.tags.find((t) => ['破冰者', '慢热型', '倾听者'].includes(t)) ?? ''
    const res = await api.aiSession({ account: me.account, topic: start.topic, mode: start.mode, social })
    if (!res.ok) {
      statusEl.textContent = '启动失败'
      err.textContent = res.error
      err.hidden = false
      return
    }
    sessionId = res.data.sessionId
    persona = res.data.persona
    nameEl.textContent = persona
    statusEl.textContent = res.data.aiEnabled ? '已连接（DeepSeek）' : '已连接（本地规则版，未配置 key）'
    addRow(res.data.greeting, false)
    speak(res.data.greeting)
    showNote('对话只保存在本次页面里；结束后可以保存文字记录。')
  }

  const send = async (): Promise<void> => {
    const text = input.value.trim()
    if (!text || !sessionId) return
    input.value = ''
    addRow(text, true)
    sendBtn.disabled = true
    statusEl.textContent = '对方正在思考…'
    const res = await api.aiChat({ sessionId, message: text })
    sendBtn.disabled = false
    if (!res.ok) {
      statusEl.textContent = '出错了'
      err.textContent = res.error
      err.hidden = false
      return
    }
    err.hidden = true
    statusEl.textContent = '对方在线'
    addRow(res.data.reply, false)
    speak(res.data.reply)
  }

  sendBtn.onclick = () => void send()
  input.onkeydown = (e) => {
    if (e.key === 'Enter') void send()
  }

  $<HTMLButtonElement>('#ai-end').onclick = async () => {
    if (!sessionId) {
      location.hash = '#/app'
      return
    }
    $<HTMLButtonElement>('#ai-end').disabled = true
    statusEl.textContent = '正在生成评语…'
    const res = await api.aiReview({ sessionId, topic: start.topic, transcript: transcript.join('\n') })
    const comment = res.ok ? res.data.comment : '这次评语生成失败，不影响记录。'
    addRow(`📝 评语：${comment}`, false)
    statusEl.textContent = '已结束'
    showNote('已经把这次评语给你了，返回大厅继续。')

    if (transcript.length > 0) {
      void api.saveTranscript({
        account: me.account,
        roomId: sessionId,
        mode: start.mode,
        text: transcript.join('\n'),
      })
    }
    window.setTimeout(() => {
      location.hash = '#/app'
    }, 2200)
  }

  void startSession()
}
