import './room.css'
import { api } from './api'
import { currentUser } from './auth'
import { clientId } from './client'
import { onLeave } from './lifecycle'

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
        <div class="lbl"><span>已练 <b id="r-clock">00:00</b></span><span>最低 3:00 · 优秀 10:00</span></div>
      </div>
      <button class="btn ghost sm" id="r-copy" type="button">复制房间号</button>
      <button class="btn ghost sm" id="r-end" type="button">结束练习</button>
    </div>

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
            <p>最近一件让你开心的小事</p>
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
              <button class="link" id="r-rescue-say" type="button">🔊 听一下</button>
            </div>
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
  let ticker: number | undefined
  let alive = true

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
    liveEl.textContent = `麦克风${micOn ? '已开启' : '未开启'} · 听筒${earOn ? '已开' : '关闭'}`
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

  const speak = (text: string): void => {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.9
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    } catch {
      // 浏览器不支持就算了，不打断练习
    }
  }

  const touchActivity = (): void => {
    lastActivity = Date.now()
    if (rescueShown) {
      rescueShown = false
      rescueEl.hidden = true
    }
  }

  const addBubble = (seconds: string, self: boolean): void => {
    streamEl.querySelector('.stream-empty')?.remove()
    const row = document.createElement('div')
    row.className = `msg ${self ? 'self' : ''}`
    const who = self ? (me?.account?.[0] ?? '我') : (peerLabel[0] ?? '对')
    row.innerHTML = `
      <span class="m-ava" style="background:${self ? '#ff6b4a' : '#7c6cf6'}">${who}</span>
      <div class="bub voice">🎤 ${seconds} 秒
        <span class="tr">（转写：接入语音识别后显示）</span>
      </div>`
    streamEl.appendChild(row)
    streamEl.scrollTop = streamEl.scrollHeight
  }

  /* 8 秒没人说话 → 右侧救场提示（只弹文字，点一下才朗读） */
  const idleTimer = window.setInterval(() => {
    if (!started || rescueShown) return
    if (Date.now() - lastActivity < 8000) return
    rescueShown = true
    rescueText.textContent = RESCUES[Math.floor(Math.random() * RESCUES.length)]
    rescueEl.hidden = false
  }, 1000)

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
          addBubble(seconds, true)
          void api.signalSend({ roomId, from: myClientId, kind: 'bubble', data: { seconds } })
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
      const d = data as { seconds?: number }
      addBubble(String(d.seconds ?? 1), false)
      touchActivity()
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
  const tick = (): void => {
    if (!started) return
    const sec = Math.floor((Date.now() - started) / 1000)
    $<HTMLSpanElement>('#r-clock').textContent = fmt(sec)
    $<HTMLElement>('#r-bar').style.width = `${Math.min(100, (sec / 600) * 100)}%`
  }

  /* ---------- 麦克风 / 听筒 ---------- */
  const stopMic = async (): Promise<void> => {
    stopLevelMeter()
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

  /* ---------- 退出 ---------- */
  const leaveRoom = (): void => {
    alive = false
    void stopMic()
    closePc()
    if (ticker) window.clearInterval(ticker)
    // 记账交给服务端：谁离开都由它一次性给双方各写一条，不会漏
    void api.roomLeave({ roomId, clientId: myClientId })
    location.hash = '#/app'
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
