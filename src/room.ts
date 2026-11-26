import './room.css'
import { api } from './api'
import { currentUser } from './auth'
import { clientId } from './client'
import { onLeave } from './lifecycle'
import { cardOf } from './topics'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

const fmt = (sec: number): string =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

const LINK_TEXT: Record<string, string> = {
  new: '准备中',
  connecting: '正在连接…',
  connected: '已连接',
  disconnected: '连接中断',
  failed: '连接失败',
  closed: '已关闭',
}

/** 话题预习卡：进房前/房内可以先看 5 个词、3 个句型、2 个问题 */
const PREP: Record<string, { words: string[]; phrases: string[]; questions: string[] }> = {
  最近一件让你开心的小事: {
    words: ['honestly', 'tiny', 'unexpected', 'make my day', 'cheer up'],
    phrases: [
      'The smallest thing made my day.',
      'Out of nowhere, something good happened.',
      'It still makes me smile when I think about it.',
    ],
    questions: ['What was the last small thing that made you happy?', 'Do small things matter more than big ones?'],
  },
  你最近在追的剧或游戏: {
    words: ['episode', 'plot twist', 'hooked', 'character', 'recommend'],
    phrases: [
      "I'm three episodes in and already hooked.",
      'The plot is simple, but the acting carries it.',
      "I'd recommend it if you like slow stories.",
    ],
    questions: ['What are you watching or playing right now?', 'Would you recommend it to a beginner?'],
  },
  如果能立刻去一个地方: {
    words: ['somewhere', 'beach', 'crowded', 'get away', 'someday'],
    phrases: [
      'If I could teleport, I would be on a beach right now.',
      'I prefer small towns to big cities.',
      'I have been saving for that trip for months.',
    ],
    questions: ['Where would you go tomorrow if you could?', 'Do you prefer cities or small towns?'],
  },
  你最近在学什么: {
    words: ['practise', 'struggle with', 'get the hang of', 'progress', 'step by step'],
    phrases: [
      "I've been learning it for about two months.",
      'The hardest part is remembering new words.',
      'I try to practise a little every day.',
    ],
    questions: ['What are you learning these days?', 'What is the hardest part of it?'],
  },
  工作或学习里最烦的事: {
    words: ['annoying', 'deadline', 'handle', 'figure out', 'give up'],
    phrases: [
      "The most annoying thing is waiting for others.",
      "I haven't figured out a good way to handle it.",
      "I try not to give up, but sometimes I do.",
    ],
    questions: ['What is the most annoying part of your week?', 'How do you usually deal with it?'],
  },
}

function topBar(right: string): string {
  return `<div class="room-top">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="top-actions">${right}</div>
  </div>`
}

/* ---------------- 等待对方接受 ---------------- */

export function waitView(roomId: string): string {
  return `<div class="room-shell">
    ${topBar('<a class="pill-link" href="#/app">返回大厅</a>')}
    <section class="card waiting">
      <h1>等待对方接受…</h1>
      <p class="sub">邀请发出去了，把房间号给对方就能开始</p>
      <div class="room-code" id="wait-code">${roomId}</div>
      <div class="wait-actions">
        <button class="btn ghost sm" id="wait-copy" type="button">复制房间号</button>
        <button class="btn ghost sm" id="wait-cancel" type="button">取消邀请</button>
      </div>
      <p class="note">测试方法：另开一个无痕窗口（Ctrl+Shift+N）→ 登录另一个账号 → 大厅右上「房间 → 加入房间」→ 输入 ${roomId}</p>
    </section>
  </div>`
}

export function mountWait(roomId: string): void {
  const state = $<HTMLDivElement>('#wait-code')
  let stop = false
  let timer: number | undefined

  $<HTMLButtonElement>('#wait-copy').onclick = () => {
    void navigator.clipboard?.writeText(roomId)
    $<HTMLButtonElement>('#wait-copy').textContent = '已复制'
  }

  $<HTMLButtonElement>('#wait-cancel').onclick = () => {
    stop = true
    if (timer) window.clearInterval(timer)
    void api.roomLeave({ roomId, clientId: clientId() })
    location.hash = '#/app'
  }

  const poll = async (): Promise<void> => {
    if (stop) return
    const res = await api.roomState(roomId, clientId())
    if (!res.ok) {
      state.textContent = '房间已结束'
      $<HTMLButtonElement>('#wait-cancel').textContent = '返回大厅'
      return
    }
    if (res.data.room.guest) {
      stop = true
      if (timer) window.clearInterval(timer)
      location.hash = '#/room/' + roomId
    }
  }

  void poll()
  timer = window.setInterval(() => void poll(), 1000)
  onLeave(() => {
    stop = true
    if (timer) window.clearInterval(timer)
  })
}

/* ---------------- 加入房间 ---------------- */

export function joinView(): string {
  return `<div class="room-shell">
    ${topBar('<a class="pill-link" href="#/app">返回大厅</a>')}
    <section class="card waiting">
      <h1>加入房间</h1>
      <p class="sub">输入对方给你的 6 位房间号</p>
      <label class="field">房间号
        <input id="join-code" maxlength="6" placeholder="例如 A1B2C3" autocomplete="off" />
      </label>
      <p class="err" id="join-err" hidden></p>
      <button class="btn" id="join-go" type="button">加入</button>
    </section>
  </div>`
}

export function mountJoin(): void {
  const me = currentUser()
  if (!me) {
    location.hash = '#/login'
    return
  }

  const input = $<HTMLInputElement>('#join-code')
  const err = $<HTMLParagraphElement>('#join-err')

  const go = async (): Promise<void> => {
    const code = input.value.trim().toUpperCase()
    if (code.length !== 6) {
      err.textContent = '房间号是 6 位'
      err.hidden = false
      return
    }
    const res = await api.roomJoin({ roomId: code, account: me.account, clientId: clientId() })
    if (!res.ok) {
      err.textContent = res.error
      err.hidden = false
      return
    }
    location.hash = '#/room/' + code
  }

  $<HTMLButtonElement>('#join-go').onclick = () => void go()
  input.onkeydown = (e) => {
    if (e.key === 'Enter') void go()
  }
}

/* ---------------- 房间 ---------------- */

export function roomView(roomId: string): string {
  return `<div class="room-shell">
    <div class="rbar">
      <div class="rwho">
        <b id="r-title">房间 ${roomId}</b>
        <span class="muted" id="r-peer">正在确认对方…</span>
      </div>
      <div class="prog">
        <div class="track"><i id="r-bar"></i></div>
        <div class="lbl"><span>已练 <b id="r-clock">00:00</b></span><span id="r-goal">最低 3:00 · 优秀 10:00</span></div>
      </div>
      <button class="btn ghost sm" id="r-copy" type="button">复制房间号</button>
      <button class="btn ghost sm" id="r-end" type="button">结束练习</button>
    </div>

    <div class="rbanner" id="r-banner" hidden></div>

    <div class="rbody">
      <div class="rleft">
        <div class="stream" id="r-stream">
          <div class="stream-empty">双方都点「麦克风」并允许权限后，就能互相听见。</div>
        </div>
        <div class="inputrow">
          <button class="btn sm" id="r-mic" type="button">麦克风</button>
          <button class="btn ghost sm" id="r-ear" type="button">听筒</button>
          <span class="muted" id="r-live">麦克风未开启 · 听筒关闭</span>
          <span class="muted" id="r-link">连接：准备中</span>
          <button class="btn ghost sm" id="r-retry" type="button">重连</button>
        </div>
        <audio id="r-remote" autoplay playsinline muted></audio>
      </div>

      <aside class="rright">
        <div class="rright-head">AI 副驾</div>
        <div class="copilot">
          <div class="cblock">
            <h4>当前话题</h4>
            <p id="r-topic">最近一件让你开心的小事</p>
          </div>

          <div class="cblock">
            <button class="btn ghost sm" id="r-switch" type="button">聊不下去了，换个话题</button>
          </div>
          <div class="cblock">
            <h4>高频词</h4>
            <div class="words"><span>honestly</span><span>kind of</span><span>make my day</span></div>
          </div>
          <div class="cblock">
            <h4>救场句型（点一下听发音）</h4>
            <div class="phrase" data-say="That reminds me of something that happened last week.">
              <span class="en">That reminds me of…</span>
              <button class="say" type="button">🔊</button>
            </div>
            <div class="phrase" data-say="I can't remember the word, but it's like a small box.">
              <span class="en">I can't remember the word, but it's like…</span>
              <button class="say" type="button">🔊</button>
            </div>
            <div class="rescue" id="r-rescue" hidden>
              <b>安静 8 秒了</b>
              <p id="r-rescue-text">Honestly, the smallest thing made my day…</p>
              <ul class="rescue-ideas" id="r-rescue-ideas"></ul>
              <button class="link" id="r-rescue-say" type="button">🔊 听一下</button>
            </div>
          </div>

          <div class="cblock">
            <button class="btn ghost sm" id="r-switch" type="button">聊不下去了，换个话题</button>
          </div>
        </div>
      </aside>
    </div>

    <div class="mask" id="left-mask" hidden>
      <div class="modal left-modal">
        <p class="left-text" id="left-text">对方已离开房间</p>
        <button class="btn" id="left-go" type="button">离开房间</button>
      </div>
    </div>

    <div class="mask" id="save-mask" hidden>
      <div class="modal save-modal">
        <p class="left-text">要保存这次对话的文字记录吗？</p>
        <p class="sub">保存后以后可以复盘；不保存就只留时长和标签。</p>
        <div class="save-actions">
          <button class="btn ghost sm" id="save-no" type="button">不保存</button>
          <button class="btn sm" id="save-yes" type="button">保存并离开</button>
        </div>
      </div>
    </div>
  </div>`
}

export function mountRoom(roomId: string): void {
  const me = currentUser()
  if (!me) {
    location.hash = '#/login'
    return
  }

  const myClientId = clientId()
  let started = 0
  let roomMode: 'chill' | 'stretch' = 'chill'
  let ticker: number | undefined
  let alive = true

  /* 按等级定练习时长：目标是等级对应分钟，最低是目标的一半。
     URL 带 ?fast=1 时全部缩成 1/10，方便测试横幅和动效。 */
  const fastMode = new URLSearchParams(location.search).get('fast') === '1'
  const level = me.level ?? 'B1'
  const goalMinutes = level === 'A2' ? 2 : level === 'B1' ? 5 : 10
  const goalSec = fastMode ? goalMinutes * 6 : goalMinutes * 60
  const minSec = Math.round(goalSec / 2)

  const goalEl = $<HTMLSpanElement>('#r-goal')
  if (goalEl) {
    goalEl.textContent = `最低 ${fmt(minSec)} · 目标 ${fmt(goalSec)}${fastMode ? ' · 测试模式' : ''}`
  }

  const linkEl = $<HTMLSpanElement>('#r-link')
  const liveEl = $<HTMLSpanElement>('#r-live')
  const micBtn = $<HTMLButtonElement>('#r-mic')
  const earBtn = $<HTMLButtonElement>('#r-ear')
  const remoteAudio = $<HTMLAudioElement>('#r-remote')
  // 默认静音：不点「听筒」就不该有任何声音进来
  remoteAudio.muted = true

  let micStream: MediaStream | null = null
  let micOn = false
  let earOn = false

  const paintLive = (): void => {
    liveEl.textContent = `麦克风${micOn ? '已开启' : '未开启'} · 听筒${earOn ? '已开' : '关闭'}${
      micOn ? ' · 转写由浏览器提供，需联网' : ''
    }`
  }
  paintLive()

  /* ---------- 消息流 / 冷场 / 朗读 ---------- */
  const streamEl = $<HTMLDivElement>('#r-stream')
  const rescueEl = $<HTMLDivElement>('#r-rescue')
  const rescueText = $<HTMLParagraphElement>('#r-rescue-text')

  let peerLabel = '对方'
  let lastActivity = Date.now()
  let rescueShown = false

  const RESCUES = [
    'Honestly, the smallest thing made my day…',
    'That reminds me of something that happened last week.',
    "I can't remember the word, but it's like…",
    'What about you? Has anything like that happened to you?',
  ]

  /* ---------- 朗读：优先用本机音色，并提前把引擎叫醒 ---------- */
  let preferredVoice: SpeechSynthesisVoice | null = null

  const pickVoice = (): void => {
    try {
      const english = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
      // Edge 的 "Online (Natural)" 是云端音色，更慢；优先本机音色。
      preferredVoice = english.find((v) => !/online|natural/i.test(v.name)) ?? english[0] ?? null
    } catch {
      preferredVoice = null
    }
  }

  const speak = (text: string): void => {
    try {
      if (speechSynthesis.paused) speechSynthesis.resume()
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.9
      if (preferredVoice) u.voice = preferredVoice
      // cancel 之后立刻 speak 在部分浏览器会吞掉，隔一帧再发
      window.setTimeout(() => {
        try {
          speechSynthesis.speak(u)
        } catch {
          // 忽略
        }
      }, 20)
    } catch {
      // 浏览器不支持就算了，不打断练习
    }
  }

  const warmUpSpeech = (): void => {
    try {
      pickVoice()
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      u.rate = 2
      if (preferredVoice) u.voice = preferredVoice
      speechSynthesis.speak(u)
      window.setTimeout(() => {
        try {
          speechSynthesis.cancel()
        } catch {
          // 忽略
        }
      }, 30)
    } catch {
      // 忽略
    }
  }

  pickVoice()
  warmUpSpeech()
  try {
    speechSynthesis.onvoiceschanged = () => {
      pickVoice()
      warmUpSpeech()
    }
  } catch {
    // 忽略
  }
  // 第一次任何点击都顺便再叫醒一次引擎（预热放这里比放页面加载时更可靠）
  document.addEventListener('pointerdown', warmUpSpeech, { once: true })

  const touchActivity = (): void => {
    lastActivity = Date.now()
    if (rescueShown) {
      rescueShown = false
      rescueEl.hidden = true
    }
  }

  /* ---------- 消息流 ---------- */
  const transcriptLines: string[] = []

  const escapeHtml = (s: string): string =>
    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

  const addBubble = (seconds: string, self: boolean, text = ''): void => {
    streamEl.querySelector('.stream-empty')?.remove()
    const row = document.createElement('div')
    row.className = `msg ${self ? 'self' : ''}`
    const who = self ? (me?.account?.[0] ?? '我') : (peerLabel[0] ?? '对')
    const content = text
      ? `<div class="bub"><b class="bub-text">${escapeHtml(text)}</b><span class="tr">🎤 ${seconds} 秒</span></div>`
      : `<div class="bub voice">🎤 ${seconds} 秒<span class="tr">（没识别到文字）</span></div>`
    row.innerHTML = `<span class="m-ava" style="background:${self ? '#ff6b4a' : '#7c6cf6'}">${who}</span>${content}`
    streamEl.appendChild(row)
    streamEl.scrollTop = streamEl.scrollHeight
    if (text) transcriptLines.push(`${self ? '我' : peerLabel}：${text}`)
  }

  const systemBubble = (text: string): void => {
    streamEl.querySelector('.stream-empty')?.remove()
    const row = document.createElement('div')
    row.className = 'sys-row'
    row.textContent = text
    streamEl.appendChild(row)
    streamEl.scrollTop = streamEl.scrollHeight
  }

  /** 识别中的草稿气泡：让"正在听"看得见，减少等待感 */
  let draftEl: HTMLDivElement | null = null
  const paintDraft = (text: string): void => {
    if (!text) {
      draftEl?.remove()
      draftEl = null
      return
    }
    streamEl.querySelector('.stream-empty')?.remove()
    if (!draftEl) {
      draftEl = document.createElement('div')
      draftEl.className = 'msg self draft'
      draftEl.innerHTML = `<span class="m-ava" style="background:#ff6b4a">${me?.account?.[0] ?? '我'}</span><div class="bub draft-bub"></div>`
      streamEl.appendChild(draftEl)
    }
    const bub = draftEl.querySelector('.draft-bub')
    if (bub) bub.textContent = text
    streamEl.scrollTop = streamEl.scrollHeight
  }

  /* ---------- 顶部横幅：3 分钟鼓励 / 10 分钟强化 / 卡顿提示 ---------- */
  const bannerEl = $<HTMLDivElement>('#r-banner')
  let bannerTimer: number | undefined

  const showBanner = (text: string, tone: 'soft' | 'strong' | 'hint', onClick?: () => void): void => {
    bannerEl.textContent = text
    bannerEl.className = `rbanner ${tone}`
    bannerEl.hidden = false
    bannerEl.onclick = onClick ?? null
    if (bannerTimer) window.clearTimeout(bannerTimer)
    bannerTimer = window.setTimeout(
      () => {
        bannerEl.hidden = true
      },
      tone === 'strong' ? 9000 : 6000,
    )
  }

  /* ---------- 话题切换（手动按钮 + 连续卡顿自动提示） ---------- */
  const TOPIC_POOL = [
    '最近一件让你开心的小事',
    '你最近在追的剧或游戏',
    '如果能立刻去一个地方',
    '你最近在学什么',
    '工作或学习里最烦的事',
  ]
  const topicEl = $<HTMLParagraphElement>('#r-topic')
  let topicIndex = 0
  let stallTimes: number[] = []

  /** 冷场时给"思路"，不只是给一句现成的话 */
  const rescueIdeasEl = $<HTMLUListElement>('#r-rescue-ideas')
  const rescueIdeas = (topic: string): string[] => {
    const card = cardOf(topic)
    if (card) return [card.questions[0], card.followUps[0], card.phrases[1]].filter(Boolean)
    const simple = PREP[topic]
    return simple ? simple.questions : []
  }

  /* ---------- 话题预习卡 ---------- */
  const switchTopic = (): void => {
    topicIndex = (topicIndex + 1) % TOPIC_POOL.length
    const name = TOPIC_POOL[topicIndex]
    topicEl.textContent = name
    systemBubble(`已切换到话题：${name}`)
    stallTimes = []
    void api.signalSend({ roomId, from: myClientId, kind: 'topic', data: { name } })
    touchActivity()
  }

  const registerStall = (): void => {
    const now = Date.now()
    stallTimes = stallTimes.filter((t) => now - t < 60000)
    stallTimes.push(now)
    if (stallTimes.length >= 3) {
      showBanner('连着卡住几次了 · 点这里换个话题', 'hint', switchTopic)
      stallTimes = []
    }
  }

  /* 8 秒没人说话 → 右侧救场提示（只弹文字，点一下才朗读） */
  const idleTimer = window.setInterval(() => {
    if (!started || rescueShown) return
    if (Date.now() - lastActivity < 8000) return
    rescueShown = true
    rescueText.textContent = RESCUES[Math.floor(Math.random() * RESCUES.length)]
    const ideas = rescueIdeas(topicEl.textContent ?? '')
    rescueIdeasEl.innerHTML = ideas.map((t) => `<li>${t}</li>`).join('')
    rescueEl.hidden = false
    registerStall()
  }, 1000)

  /* ---------- 语音识别（Edge / Chrome 自带，需要联网） ---------- */
  type RecognitionLike = {
    lang: string
    continuous: boolean
    interimResults: boolean
    start: () => void
    stop: () => void
    onresult: ((event: unknown) => void) | null
    onend: (() => void) | null
    onerror: ((event: unknown) => void) | null
  }

  const recognitionCtor = (
    window as unknown as {
      SpeechRecognition?: new () => RecognitionLike
      webkitSpeechRecognition?: new () => RecognitionLike
    }
  ).SpeechRecognition ??
    (
      window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike }
    ).webkitSpeechRecognition

  let recognition: RecognitionLike | null = null
  let recognitionOn = false
  let finalText = ''
  let interimText = ''

  const startRecognition = (): void => {
    if (!recognitionCtor || recognition) return
    try {
      const rec = new recognitionCtor()
      rec.lang = 'en-US'
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (event: unknown) => {
        const e = event as {
          resultIndex: number
          results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } }
        }
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i]
          if (result.isFinal) finalText = `${finalText} ${result[0].transcript}`.trim()
          else interim += result[0].transcript
        }
        interimText = interim.trim()
        paintDraft(interimText)
      }
      rec.onerror = () => {
        // 识别失败就静默降级成"只有时长"的气泡
      }
      rec.onend = () => {
        if (recognitionOn) {
          try {
            rec.start()
          } catch {
            // 浏览器拒绝重启就算了
          }
        }
      }
      rec.start()
      recognition = rec
      recognitionOn = true
    } catch {
      recognition = null
    }
  }

  const stopRecognition = (): void => {
    recognitionOn = false
    try {
      recognition?.stop()
    } catch {
      // 忽略
    }
    recognition = null
    finalText = ''
    interimText = ''
    paintDraft('')
  }

  document.querySelectorAll<HTMLElement>('[data-say]').forEach((el) => {
    const say = (): void => speak(el.dataset.say ?? '')
    el.querySelector<HTMLButtonElement>('.say')?.addEventListener('click', (e) => {
      e.stopPropagation()
      say()
    })
    el.addEventListener('click', say)
  })
  $<HTMLButtonElement>('#r-rescue-say').onclick = () => speak(rescueText.textContent ?? '')

  /* ---------- 音量检测：自动生成「🎤 N 秒」气泡 ---------- */
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let levelTimer: number | undefined
  let speaking = false
  let segStart = 0
  let lastLoudAt = 0

  const startLevelMeter = (stream: MediaStream): void => {
    try {
      audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
    } catch {
      return
    }

    const buf = new Float32Array(analyser.fftSize)
    levelTimer = window.setInterval(() => {
      if (!analyser) return
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      const now = Date.now()

      if (rms > 0.02) {
        lastLoudAt = now
        touchActivity()
        if (!speaking) {
          speaking = true
          segStart = now
        }
      } else if (speaking && now - lastLoudAt > 600) {
        speaking = false
        const ms = lastLoudAt - segStart
        if (ms >= 700) {
          const seconds = String(Math.max(1, Math.round(ms / 1000)))
          const text = (finalText || interimText).trim()
          finalText = ''
          interimText = ''
          paintDraft('')
          addBubble(seconds, true, text)
          void api.signalSend({ roomId, from: myClientId, kind: 'bubble', data: { seconds, text } })
        }
      }
    }, 100)
  }

  const stopLevelMeter = (): void => {
    if (levelTimer) window.clearInterval(levelTimer)
    levelTimer = undefined
    analyser = null
    void audioCtx?.close().catch(() => undefined)
    audioCtx = null
    speaking = false
  }

  /* ---------- WebRTC ---------- */
  let pc: RTCPeerConnection | null = null
  let sender: RTCRtpSender | null = null
  let offered = false
  let pendingIce: RTCIceCandidateInit[] = []
  let lastSeq = 0

  const paintLink = (): void => {
    const state = pc?.connectionState ?? 'new'
    linkEl.textContent = `连接：${LINK_TEXT[state] ?? state}`
  }

  const closePc = (): void => {
    pc?.close()
    pc = null
    sender = null
  }

  const flushIce = async (): Promise<void> => {
    if (!pc) return
    for (const c of pendingIce) {
      try {
        await pc.addIceCandidate(c)
      } catch {
        // 单条候选失败不影响整体，继续下一条
      }
    }
    pendingIce = []
  }

  const buildPc = (): void => {
    closePc()
    pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    sender = null
    offered = false
    pendingIce = []

    pc.ontrack = (e) => {
      remoteAudio.srcObject = e.streams[0] ?? new MediaStream([e.track])
      // 收到轨道时再同步一次：没点听筒就保持静音
      remoteAudio.muted = !earOn
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        void api.signalSend({ roomId, from: myClientId, kind: 'ice', data: e.candidate.toJSON() })
      }
    }
    pc.onconnectionstatechange = paintLink
    paintLink()
  }

  buildPc()

  /**
   * 找到"真正在用的那条音轨"，并把它设成既能收也能发。
   * 关键：来客那边如果这条轨道是 recvonly，麦克风挂上去也发不出去 —— 单向无声就是这么来的。
   */
  const ensureSender = async (): Promise<void> => {
    if (!pc) return
    const list = pc.getTransceivers()
    const live = list.find((t) => t.mid !== null) ?? list[0]
    if (!live) return
    if (live.direction !== 'sendrecv') live.direction = 'sendrecv'
    sender = live.sender
    if (micStream) {
      const track = micStream.getAudioTracks()[0]
      if (track) await sender.replaceTrack(track).catch(() => undefined)
    }
  }

  const sendOffer = async (): Promise<void> => {
    if (!pc || offered) return
    offered = true
    // 房主负责建出这条音轨（不收发就不成对）
    if (pc.getTransceivers().length === 0) pc.addTransceiver('audio', { direction: 'sendrecv' })
    await ensureSender()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await ensureSender()
    await api.signalSend({ roomId, from: myClientId, kind: 'offer', data: pc.localDescription })
  }

  const handleSignal = async (kind: string, data: unknown): Promise<void> => {
    if (!pc) return
    if (kind === 'offer') {
      await pc.setRemoteDescription(data as RTCSessionDescriptionInit)
      await ensureSender() // 把来客这条轨道改成 sendrecv，answer 里才会带"我会发"
      await flushIce()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await api.signalSend({ roomId, from: myClientId, kind: 'answer', data: pc.localDescription })
    } else if (kind === 'answer') {
      await pc.setRemoteDescription(data as RTCSessionDescriptionInit)
      await ensureSender()
      await flushIce()
    } else if (kind === 'ice') {
      // 关键修复：对方描述还没到时，候选先存着，等描述到了再一条条加
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(data as RTCIceCandidateInit)
        } catch {
          // 忽略单条失败
        }
      } else {
        pendingIce.push(data as RTCIceCandidateInit)
      }
    } else if (kind === 'retry') {
      buildPc()
    } else if (kind === 'bubble') {
      const d = data as { seconds?: number; text?: string }
      addBubble(String(d.seconds ?? 1), false, typeof d.text === 'string' ? d.text : '')
      touchActivity()
    } else if (kind === 'topic') {
      const d = data as { name?: string }
      if (d.name) {
        topicEl.textContent = d.name
        systemBubble(`对方切换了话题：${d.name}`)
        touchActivity()
      }
    }
  }

  /* ---------- 房间状态 + 信令轮询 ---------- */
  let sawGuest = false
  let ended = false

  const showLeft = (text: string): void => {
    if (ended) return
    ended = true
    $<HTMLParagraphElement>('#left-text').textContent = text
    $<HTMLDivElement>('#left-mask').hidden = false
  }

  const poll = async (): Promise<void> => {
    if (!alive) return

    const res = await api.roomState(roomId, myClientId)
    if (!res.ok) {
      showLeft('房间已结束')
      return
    }

    const room = res.data.room
    const amHost = res.data.role === 'host'
    roomMode = room.mode === 'stretch' ? 'stretch' : 'chill'
    if (room.topic && topicEl.textContent !== room.topic) {
      topicEl.textContent = room.topic
    }
    if (res.data.role === 'none') {
      showLeft('你已不在这个房间里')
      return
    }

    // 显示"对方"是谁：房主看 guest，来客看 host
    const peerName = amHost ? room.guest?.account : room.host.account
    if (peerName) peerLabel = peerName
    $<HTMLSpanElement>('#r-peer').textContent = room.guest
      ? `对方已进入：${peerName ?? ''}`
      : '等待对方进入…'

    if (room.guest) sawGuest = true
    if (amHost && sawGuest && !room.guest) {
      showLeft('对方已离开房间')
      return
    }

    if (room.startedAt && !started) {
      started = room.startedAt
      ticker = window.setInterval(tick, 1000)
    }

    if (amHost && room.guest) await sendOffer()

    const sig = await api.signalPoll(roomId, lastSeq)
    if (sig.ok) {
      for (const m of sig.data.messages) {
        lastSeq = Math.max(lastSeq, m.seq)
        if (m.from === myClientId) continue
        await handleSignal(m.kind, m.data)
      }
    }
  }

  /* ---------- 计时 ---------- */
  let encouraged = false
  let rewarded = false

  const tick = (): void => {
    if (!started) return
    const sec = Math.floor((Date.now() - started) / 1000)
    $<HTMLSpanElement>('#r-clock').textContent = fmt(sec)
    $<HTMLElement>('#r-bar').style.width = `${Math.min(100, (sec / goalSec) * 100)}%`

    if (!encouraged && sec >= minSec) {
      encouraged = true
      showBanner('已聊满最低时间，保持住', 'soft')
    }
    if (!rewarded && sec >= goalSec) {
      rewarded = true
      showBanner(`${goalMinutes} 分钟达成，这次练得很扎实 🎉`, 'strong')
      systemBubble(`🎉 达到目标时间：${goalMinutes} 分钟`)
    }
  }

  /* ---------- 麦克风 / 听筒 ---------- */
  const stopMic = async (): Promise<void> => {
    stopLevelMeter()
    stopRecognition()
    micStream?.getTracks().forEach((t) => t.stop())
    micStream = null
    micOn = false
    if (sender) await sender.replaceTrack(null).catch(() => undefined)
    micBtn.textContent = '麦克风'
    paintLive()
  }

  micBtn.onclick = async () => {
    if (micOn) {
      await stopMic()
      return
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        liveEl.textContent = '这个浏览器不支持麦克风'
        return
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const track = micStream.getAudioTracks()[0]
      if (sender) await sender.replaceTrack(track)
      startLevelMeter(micStream)
      startRecognition()
      micOn = true
      micBtn.textContent = '关闭麦克风'
      paintLive()
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      liveEl.textContent =
        name === 'NotAllowedError'
          ? '你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许'
          : name === 'NotFoundError'
            ? '没检测到麦克风设备'
            : '开启麦克风失败，看控制台报错'
    }
  }

  earBtn.onclick = () => {
    earOn = !earOn
    remoteAudio.muted = !earOn
    earBtn.textContent = earOn ? '听筒已开' : '听筒'
    paintLive()
  }

  $<HTMLButtonElement>('#r-retry').onclick = () => {
    buildPc()
    // 来客重连时通知房主一起重建，否则单边重建还是连不上
    void api.signalSend({ roomId, from: myClientId, kind: 'retry', data: {} })
  }

  $<HTMLButtonElement>('#r-switch').onclick = () => switchTopic()

  /* ---------- 退出 ---------- */
  const saveMask = $<HTMLDivElement>('#save-mask')

  const doLeave = (save: boolean): void => {
    if (save && transcriptLines.length > 0) {
      void api.saveTranscript({ account: me.account, roomId, mode: roomMode, text: transcriptLines.join('\n') })
    }
    alive = false
    void stopMic()
    closePc()
    if (ticker) window.clearInterval(ticker)
    window.clearInterval(idleTimer)
    // 记账交给服务端：谁离开都由它一次性给双方各写一条，不会漏
    void api.roomLeave({ roomId, clientId: myClientId })
    location.hash = '#/app'
  }

  const leaveRoom = (): void => {
    // 有文字记录就先问一句要不要保存
    if (transcriptLines.length > 0) {
      saveMask.hidden = false
      return
    }
    doLeave(false)
  }

  $<HTMLButtonElement>('#save-yes').onclick = () => {
    saveMask.hidden = true
    doLeave(true)
  }
  $<HTMLButtonElement>('#save-no').onclick = () => {
    saveMask.hidden = true
    doLeave(false)
  }

  $<HTMLButtonElement>('#r-copy').onclick = () => {
    void navigator.clipboard?.writeText(roomId)
    $<HTMLButtonElement>('#r-copy').textContent = '已复制'
  }
  $<HTMLButtonElement>('#r-end').onclick = leaveRoom
  $<HTMLButtonElement>('#left-go').onclick = leaveRoom

  void poll()
  const poller = window.setInterval(() => void poll(), 800)

  onLeave(() => {
    alive = false
    void stopMic()
    closePc()
    if (ticker) window.clearInterval(ticker)
    window.clearInterval(poller)
    window.clearInterval(idleTimer)
  })
}
