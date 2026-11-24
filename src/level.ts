import './level.css'
import { api } from './api'
import { currentUser, updateSession } from './auth'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

const RECORD_MAX = 60

const INTEREST = ['电影迷', '科技控', '旅行党', '社会派']
const SOCIAL = ['破冰者', '慢热型', '倾听者']
const RHYTHM = ['短平快', '深聊派']

type Prompt = { topic: string; parts: string[] }

// 侧栏：不知道说什么时，给一个主题 + 每段说什么
const PROMPTS: Prompt[] = [
  {
    topic: '最近一次旅行',
    parts: ['去了哪里、和谁去的、待了几天', '印象最深的一个瞬间（看见了什么、发生了什么）', '下次还想不想去，为什么'],
  },
  {
    topic: '你最喜欢的一部电影或剧',
    parts: ['是什么、什么时候看的、和谁一起', '为什么喜欢：剧情、演员还是某个场景', '你会推荐给谁，为什么是他'],
  },
  {
    topic: '一个让你开心的周末',
    parts: ['那天你做了什么，从早到晚', '哪个细节最让你开心', '如果重来一次，你想改哪一件事'],
  },
  {
    topic: '工作或学习里最烦的一件事',
    parts: ['具体是什么麻烦，什么时候开始的', '它怎么影响你的一天', '你试过什么办法，打算怎么办'],
  },
  {
    topic: '你最近在学的东西',
    parts: ['学什么、学了多久、为什么学', '最难的地方在哪', '如果让你教别人，第一节课你会讲什么'],
  },
]

type Phase = 'idle' | 'recording' | 'analyzing' | 'result'

export function levelView(): string {
  const me = currentUser()
  return `<div class="level-shell">
    <div class="level-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions"><span class="muted">${me?.account ?? '未登录'}</span></div>
    </div>

    <div class="level-grid">
      <section class="card level-card">
        <div class="level-head">
          <h1>先花一分钟，让我们知道从哪儿开始</h1>
        </div>
        <div id="level-body"></div>
      </section>

      <aside class="card level-side">
        <h3>不知道说什么？</h3>
        <div id="prompt-box"></div>
        <button class="btn ghost sm" type="button" id="prompt-next">换一个主题</button>
        <p class="side-note">不用照念，顺着这三段说下去就行。</p>
      </aside>
    </div>
  </div>`
}

/** 弹一个小对话框让用户自己填 */
function askText(title: string, placeholder: string, maxLength = 12): Promise<string | null> {
  return new Promise((resolve) => {
    const mask = document.createElement('div')
    mask.className = 'mask'
    mask.innerHTML = `<div class="modal ask-modal">
      <h3>${title}</h3>
      <input id="ask-input" maxlength="${maxLength}" placeholder="${placeholder}" />
      <div class="ask-actions">
        <button class="btn ghost sm" type="button" data-cancel>取消</button>
        <button class="btn sm" type="button" data-ok>确定</button>
      </div>
    </div>`
    document.body.appendChild(mask)
    const input = mask.querySelector<HTMLInputElement>('#ask-input')!
    const done = (value: string | null): void => {
      mask.remove()
      resolve(value)
    }
    input.focus()
    mask.querySelector('[data-ok]')!.addEventListener('click', () => done(input.value.trim() || null))
    mask.querySelector('[data-cancel]')!.addEventListener('click', () => done(null))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done(input.value.trim() || null)
    })
  })
}

export function mountLevel(): void {
  const me = currentUser()
  if (!me) {
    location.hash = '#/login'
    return
  }

  const body = $<HTMLDivElement>('#level-body')
  const promptBox = $<HTMLDivElement>('#prompt-box')
  const grid = $<HTMLDivElement>('.level-grid')
  const side = $<HTMLElement>('.level-side')

  /** 录音阶段显示侧栏（与主卡等高）；问卷阶段完全移出屏幕 */
  const setSidebarVisible = (visible: boolean): void => {
    side.hidden = !visible
    side.style.display = visible ? '' : 'none'
    grid.classList.toggle('full', !visible)
  }

  let phase: Phase = 'idle'
  let seconds = 0
  let pauses = 0
  let stream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let timer: number | undefined
  let levelTimer: number | undefined
  let speaking = false
  let lastLoudAt = 0

  let promptIndex = Math.floor(Math.random() * PROMPTS.length)

  const drawPrompt = (): void => {
    const p = PROMPTS[promptIndex]
    promptBox.innerHTML = `
      <div class="prompt-topic">${p.topic}</div>
      <ol class="prompt-parts">
        ${p.parts.map((part, i) => `<li><b>第 ${i + 1} 段</b>${part}</li>`).join('')}
      </ol>`
  }
  drawPrompt()
  $<HTMLButtonElement>('#prompt-next').onclick = () => {
    if (PROMPTS.length < 2) return
    let next = promptIndex
    while (next === promptIndex) next = Math.floor(Math.random() * PROMPTS.length)
    promptIndex = next
    drawPrompt()
  }

  const stopAudio = (): void => {
    if (timer) window.clearInterval(timer)
    timer = undefined
    if (levelTimer) window.clearInterval(levelTimer)
    levelTimer = undefined
    analyser = null
    void audioCtx?.close().catch(() => undefined)
    audioCtx = null
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    speaking = false
  }

  const renderIdle = (): void => {
    phase = 'idle'
    setSidebarVisible(true)
    body.innerHTML = `
      <div class="rec-stage">
        <div class="rec-dot">🎙️</div>
        <div class="rec-timer">00:00</div>
      </div>
      <button class="btn" id="rec-go" type="button">开始录音</button>
      <p class="err" id="rec-err" hidden></p>`
    $<HTMLButtonElement>('#rec-go').onclick = () => void startRecording()
  }

  const showRecError = (text: string): void => {
    const err = document.querySelector<HTMLParagraphElement>('#rec-err')
    if (!err) return
    err.textContent = text
    err.hidden = false
  }

  const startRecording = async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showRecError('这个浏览器不支持麦克风，换 Edge 或 Chrome')
        return
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      showRecError(
        name === 'NotAllowedError' ? '你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许' : '打不开麦克风',
      )
      return
    }

    phase = 'recording'
    seconds = 0
    pauses = 0
    body.innerHTML = `
      <div class="rec-stage">
        <div class="rec-dot recording">●</div>
        <div class="rec-timer" id="rec-timer">00:00</div>
      </div>
      <button class="btn dark" id="rec-stop" type="button">说完了</button>
      <p class="err" id="rec-err" hidden></p>`

    $<HTMLButtonElement>('#rec-stop').onclick = () => void finishRecording()

    // 音量检测：只为数停顿次数，不录音、不上传
    try {
      audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Float32Array(analyser.fftSize)
      levelTimer = window.setInterval(() => {
        if (!analyser) return
        analyser.getFloatTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
        const loud = Math.sqrt(sum / buf.length) > 0.02
        const now = Date.now()
        if (loud) {
          lastLoudAt = now
          speaking = true
        } else if (speaking && now - lastLoudAt > 700) {
          speaking = false
          pauses++
        }
      }, 100)
    } catch {
      // 分析不了就只按时间算分
    }

    timer = window.setInterval(() => {
      seconds++
      const el = document.querySelector<HTMLDivElement>('#rec-timer')
      if (el) el.textContent = `00:${String(seconds).padStart(2, '0')}`
      if (seconds >= RECORD_MAX) void finishRecording()
    }, 1000)
  }

  const finishRecording = async (): Promise<void> => {
    if (phase !== 'recording') return
    stopAudio()
    phase = 'analyzing'
    body.innerHTML = `
      <div class="analyzing">
        <div class="dots"><i></i><i></i><i></i></div>
        <p class="sub">AI 正在分析你的语音……</p>
      </div>`
    await new Promise((r) => setTimeout(r, 1200))
    renderResult(seconds, pauses)
  }

  const renderResult = (saidSeconds: number, pauseCount: number): void => {
    phase = 'result'
    setSidebarVisible(false)
    const score = Math.round(Math.max(20, Math.min(95, 30 + (saidSeconds / 60) * 50 - pauseCount * 3)))
    const level = score >= 78 ? 'B2' : score >= 58 ? 'B1' : 'A2'

    const pickedInterests: string[] = []
    const interestOptions = [...INTEREST]
    let social = ''
    let rhythm = ''
    let socialOptions = [...SOCIAL]
    let rhythmOptions = [...RHYTHM]

    const quizHtml = (): string => `
      <div class="qblock">
        <div class="q">① 休息时你最愿意点开什么？<span class="q-hint">可多选</span></div>
        <div class="opts" data-group="interest">
          ${[...interestOptions, '__other__']
            .map((t) =>
              t === '__other__'
                ? '<button class="opt other" type="button" data-other="interest">+ 其他</button>'
                : `<button class="opt ${pickedInterests.includes(t) ? 'on' : ''}" type="button">${t}</button>`,
            )
            .join('')}
        </div>
      </div>

      <div class="qblock">
        <div class="q">② 走进一个全是陌生人的房间，你会？</div>
        <div class="opts" data-group="social">
          ${[...socialOptions, '__other__']
            .map((t) =>
              t === '__other__'
                ? '<button class="opt other" type="button" data-other="social">+ 其他</button>'
                : `<button class="opt ${social === t ? 'on' : ''}" type="button">${t}</button>`,
            )
            .join('')}
        </div>
      </div>

      <div class="qblock">
        <div class="q">③ 一次练习你想聊多久？</div>
        <div class="opts" data-group="rhythm">
          ${[...rhythmOptions, '__other__']
            .map((t) =>
              t === '__other__'
                ? '<button class="opt other" type="button" data-other="rhythm">+ 其他</button>'
                : `<button class="opt ${rhythm === t ? 'on' : ''}" type="button">${t}</button>`,
            )
            .join('')}
        </div>
      </div>

      <div class="qblock">
        <div class="q">④ 你认为你是……<span class="q-hint">可以不填</span></div>
        <input class="self-input" id="self-desc" maxlength="40" placeholder="比如：大三学生 / 程序员 / 话痨但怕生（可留空）" />
      </div>`

    const paint = (): void => {
      body.innerHTML = `
        <div class="result-head">
          <div>
            <div class="sub">初步等级</div>
            <div class="grade"><b>${level}</b></div>
          </div>
          <div class="result-meta">
            <div>说了 <b>${saidSeconds}</b> 秒</div>
            <div>停顿 <b>${pauseCount}</b> 次</div>
            <div class="muted">这是"看时长和停顿"给的粗分，接入语音识别后会换成真实评分</div>
          </div>
        </div>
        <div class="quiz" id="quiz">${quizHtml()}</div>
        <p class="err" id="level-err" hidden></p>
        <button class="btn" id="level-done" type="button">完成，进入大厅</button>`

      body.querySelectorAll<HTMLElement>('.opts').forEach((box) => {
        box.onclick = async (e) => {
          const target = e.target as HTMLElement
          const other = target.closest<HTMLButtonElement>('[data-other]')
          if (other) {
            const group = other.dataset.other
            const value = await askText('自己写一个标签', '最多 12 个字', 12)
            if (!value) return
            if (group === 'interest') {
              if (!interestOptions.includes(value)) interestOptions.push(value)
              if (!pickedInterests.includes(value)) pickedInterests.push(value)
            } else if (group === 'social') {
              if (!socialOptions.includes(value)) socialOptions.push(value)
              social = value
            } else {
              if (!rhythmOptions.includes(value)) rhythmOptions.push(value)
              rhythm = value
            }
            paint()
            return
          }

          const btn = target.closest<HTMLButtonElement>('.opt')
          if (!btn) return
          const group = box.dataset.group
          const text = btn.textContent?.trim() ?? ''
          if (group === 'interest') {
            const i = pickedInterests.indexOf(text)
            if (i >= 0) pickedInterests.splice(i, 1)
            else pickedInterests.push(text)
          } else if (group === 'social') {
            social = social === text ? '' : text
          } else {
            rhythm = rhythm === text ? '' : text
          }
          paint()
        }
      })

      const selfInput = body.querySelector<HTMLInputElement>('#self-desc')
      $<HTMLButtonElement>('#level-done').onclick = async () => {
        const err = $<HTMLParagraphElement>('#level-err')
        if (pickedInterests.length === 0 || !social) {
          err.textContent = '第 ① 题至少选一个、第 ② 题选一个，我们才知道给你配谁'
          err.hidden = false
          return
        }
        const res = await api.level({
          account: me.account,
          seconds: saidSeconds,
          pauses: pauseCount,
          interests: pickedInterests,
          social,
          rhythm,
          selfDesc: selfInput?.value.trim() ?? '',
        })
        if (!res.ok) {
          err.textContent = res.error
          err.hidden = false
          return
        }
        updateSession({ level: res.data.level, tags: res.data.tags, assessed: 1 })
        location.hash = '#/app'
      }
    }

    paint()
  }

  renderIdle()

  window.addEventListener('hashchange', () => stopAudio(), { once: true })
}
