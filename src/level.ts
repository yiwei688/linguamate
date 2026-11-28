import './level.css'
import { api } from './api'
import { currentUser, updateSession } from './auth'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

const READING_MAX = 45
const ANSWER_MAX = 20

const PASSAGE = `My name is Alex and I live in a small city near the sea. On weekdays I study in the morning and work in a small cafe in the afternoon. In the evening I usually go running by the river, and then I read for half an hour before bed.`

const QUESTIONS = [
  'What do you usually do on a normal weekday?',
  'What is one thing you would like to change about your daily routine?',
]

const INTEREST = ['电影迷', '科技控', '旅行党', '社会派']
const SOCIAL = ['破冰者', '慢热型', '倾听者']
const RHYTHM = ['短平快', '深聊派']

type Segment = { seconds: number; text: string; words: number; pauses: number }

type AiAssess = { level: string; grammar: number; vocabulary: number; coherence: number; comment: string }

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
          <h1>大概三分钟，给你一个起点</h1>
        </div>
        <div id="level-body"></div>
      </section>

      <aside class="card level-side">
        <div id="side-body"></div>
      </aside>
    </div>
  </div>`
}

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
  const sideBody = $<HTMLDivElement>('#side-body')
  const grid = $<HTMLDivElement>('.level-grid')
  const side = $<HTMLElement>('.level-side')

  let stream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let stopCurrent: (() => void) | null = null
  let leaving = false

  let reading: Segment | null = null
  const answers: Segment[] = []

  const setSidebar = (visible: boolean): void => {
    side.hidden = !visible
    side.style.display = visible ? '' : 'none'
    grid.classList.toggle('full', !visible)
  }

  const sideReading = (): void => {
    sideBody.innerHTML = `
      <h3>朗读提示</h3>
      <ul class="side-list">
        <li>不用读快，<b>清楚</b>比快重要。</li>
        <li>读错了继续往下读，不用回头改。</li>
        <li>遇到不会的词，跳过去就好。</li>
        <li>读完按「我读完了」。</li>
      </ul>`
  }

  const sideAnswering = (index: number): void => {
    sideBody.innerHTML = `
      <h3>第 ${index + 1} 题怎么答</h3>
      <ul class="side-list">
        <li>先用一句话回答，再补一个<b>细节</b>或例子。</li>
        <li>最多 ${ANSWER_MAX} 秒，够了就点「说完了」。</li>
        <li>不会的词，用简单的词绕着说。</li>
        <li>可以说 "um…" 停顿，但别一直沉默。</li>
      </ul>`
  }

  const cleanupRecording = (): void => {
    if (audioCtx) {
      void audioCtx.close().catch(() => undefined)
      audioCtx = null
    }
  }

  const ensureStream = async (): Promise<MediaStream> => {
    if (stream) return stream
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return stream
  }

  /** 录一段：返回时长、识别出的文字、词数、停顿次数 */
  const recordSegment = async (maxSec: number, onTick: (sec: number) => void): Promise<Segment> => {
    const mic = await ensureStream()
    let sec = 0
    let pauses = 0
    let speaking = false
    let lastLoud = 0
    let done = false
    let finalText = ''
    let interimText = ''

    return await new Promise<Segment>((resolve) => {
      let timer = 0
      let meterTimer: number | undefined

      const finish = (): void => {
        if (done) return
        done = true
        window.clearInterval(timer)
        if (meterTimer) window.clearInterval(meterTimer)
        cleanupRecording()
        const text = (finalText || interimText).trim()
        resolve({ seconds: sec, text, words: text.split(/\s+/).filter(Boolean).length, pauses })
      }
      stopCurrent = finish

      const recognitionCtor = (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike
          webkitSpeechRecognition?: new () => SpeechRecognitionLike
        }
      ).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition

      if (recognitionCtor) {
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
          }
          rec.onerror = () => {
            // 识别失败就只用时长和停顿打分
          }
          rec.onend = () => {
            // 单段录制，不自动重启
          }
          rec.start()
          activeRecognition = rec
        } catch {
          activeRecognition = null
        }
      }

      try {
        audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(mic)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const buf = new Float32Array(analyser.fftSize)
        meterTimer = window.setInterval(() => {
          analyser.getFloatTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
          const loud = Math.sqrt(sum / buf.length) > 0.02
          const now = Date.now()
          if (loud) {
            lastLoud = now
            speaking = true
          } else if (speaking && now - lastLoud > 1200) {
            speaking = false
            pauses++
          }
        }, 100)
      } catch {
        // 分析不了就只按时间打分
      }

      timer = window.setInterval(() => {
        sec++
        onTick(sec)
        if (sec >= maxSec) finish()
      }, 1000)

      onTick(0)
    }).finally(() => {
      try {
        activeRecognition?.stop()
      } catch {
        // 忽略
      }
      activeRecognition = null
      stopCurrent = null
    })
  }

  /* ---------------- 第 1 步：朗读 ---------------- */
  const renderReading = (): void => {
    setSidebar(true)
    sideReading()
    body.innerHTML = `
      <div class="passage">
        <div class="passage-label">请朗读下面这段话（限时 ${READING_MAX} 秒）</div>
        <p>${PASSAGE}</p>
      </div>

      <div class="rec-stage small">
        <div class="rec-timer" id="rec-timer">00:00</div>
      </div>

      <button class="btn" id="rec-go" type="button">开始朗读</button>
      <button class="btn ghost" id="rec-stop" type="button" hidden>我读完了</button>
      <p class="err" id="rec-err" hidden></p>

      <div class="steps-hint">第 1 步 / 共 3 步</div>`

    $<HTMLButtonElement>('#rec-go').onclick = async () => {
      const err = $<HTMLParagraphElement>('#rec-err')
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          err.textContent = '这个浏览器不支持麦克风，换 Edge 或 Chrome'
          err.hidden = false
          return
        }
        await ensureStream()
      } catch (e) {
        const name = e instanceof DOMException ? e.name : ''
        err.textContent =
          name === 'NotAllowedError' ? '你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许' : '打不开麦克风'
        err.hidden = false
        return
      }

      $<HTMLButtonElement>('#rec-go').hidden = true
      const stopBtn = $<HTMLButtonElement>('#rec-stop')
      stopBtn.hidden = false
      stopBtn.onclick = () => stopCurrent?.()

      reading = await recordSegment(READING_MAX, (s) => {
        const el = document.querySelector<HTMLDivElement>('#rec-timer')
        if (el) el.textContent = fmt(s)
      })
      if (leaving) return
      renderAnswer(0)
    }
  }

  /* ---------------- 第 2 步：两个口语小题 ---------------- */
  const renderAnswer = (index: number): void => {
    setSidebar(true)
    sideAnswering(index)

    body.innerHTML = `
      <div class="passage">
        <div class="passage-label">第 ${index + 1} 题（限时 ${ANSWER_MAX} 秒）</div>
        <p class="question">${QUESTIONS[index]}</p>
      </div>

      <div class="rec-stage small">
        <div class="rec-timer" id="rec-timer">00:00</div>
      </div>

      <button class="btn" id="ans-go" type="button">开始回答</button>
      <button class="btn ghost" id="ans-stop" type="button" hidden>说完了</button>

      <div class="steps-hint">第 ${index + 2} 步 / 共 3 步</div>`

    $<HTMLButtonElement>('#ans-go').onclick = async () => {
      $<HTMLButtonElement>('#ans-go').hidden = true
      const stopBtn = $<HTMLButtonElement>('#ans-stop')
      stopBtn.hidden = false
      stopBtn.onclick = () => stopCurrent?.()

      const seg = await recordSegment(ANSWER_MAX, (s) => {
        const el = document.querySelector<HTMLDivElement>('#rec-timer')
        if (el) el.textContent = fmt(s)
      })
      if (leaving) return
      answers.push(seg)

      if (index + 1 < QUESTIONS.length) renderAnswer(index + 1)
      else void renderAnalyzing()
    }
  }

  /* ---------------- 第 3 步：分析 + 结果 + 画像 ---------------- */
  const tryAssess = async (): Promise<AiAssess | null> => {
    const answersText = answers.map((a) => a.text).filter(Boolean)
    if (!reading && answersText.length === 0) return null
    const res = await api.levelAssess({
      readingText: reading?.text ?? '',
      answers: answersText,
      passage: PASSAGE,
    })
    return res.ok ? res.data : null
  }

  const renderAnalyzing = async (): Promise<void> => {
    setSidebar(false)
    body.innerHTML = `
      <div class="analyzing">
        <div class="dots"><i></i><i></i><i></i></div>
        <p class="sub">正在分析你的朗读和回答……</p>
      </div>`

    // 模型评分和"假装在思考"同时跑，最少等 1.2 秒，避免一闪而过
    const [assess] = await Promise.all([tryAssess(), new Promise((r) => setTimeout(r, 1200))])
    if (leaving) return
    renderResult(assess)
  }

  const readingAccuracy = (spoken: string): number | null => {
    const said = wordsOf(spoken)
    if (said.length < 3) return null
    const pool = new Map<string, number>()
    for (const w of said) pool.set(w, (pool.get(w) ?? 0) + 1)
    const target = wordsOf(PASSAGE)
    let hit = 0
    for (const w of target) {
      const c = pool.get(w) ?? 0
      if (c > 0) {
        hit++
        pool.set(w, c - 1)
      }
    }
    return Math.round((hit / target.length) * 100)
  }

  const renderResult = (assess: AiAssess | null): void => {
    setSidebar(false)

    const readSeg = reading ?? { seconds: 0, text: '', words: 0, pauses: 0 }
    const accuracy = readingAccuracy(readSeg.text)

    const totalSec = answers.reduce((s, a) => s + a.seconds, 0)
    const totalWords = answers.reduce((s, a) => s + a.words, 0)
    const totalPauses = answers.reduce((s, a) => s + a.pauses, 0)
    const minutes = totalSec / 60
    const ppm = minutes > 0 ? totalPauses / minutes : 12
    const wpm = minutes > 0 ? totalWords / minutes : 0

    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const fluency = Math.round(clamp(100 - ppm * 8, 20, 95))
    const rate = Math.round(clamp(wpm / 1.5, 20, 95))
    const answered = answers.filter((a) => a.seconds >= 8).length
    const completion = answers.length === 0 ? 30 : Math.round(30 + (answered / answers.length) * 70)

    // 和服务端同一套权重：先显示预览等级，提交后以服务端为准
    const overall =
      accuracy === null
        ? Math.round(fluency * 0.4 + rate * 0.3 + completion * 0.3)
        : Math.round(accuracy * 0.35 + fluency * 0.25 + rate * 0.2 + completion * 0.2)
    // 有模型评分就以模型等级为准，没有才用规则分
    const ruleLevel = overall >= 80 ? 'B2' : overall >= 55 ? 'B1' : 'A2'
    const previewLevel = assess?.level ?? ruleLevel

    const pickedInterests: string[] = []
    const interestOptions = [...INTEREST]
    const socialOptions = [...SOCIAL]
    const rhythmOptions = [...RHYTHM]
    let social = ''
    let rhythm = ''

    const bar = (label: string, value: number | null, suffix = ''): string => `
      <div class="metric">
        <div class="metric-row"><span>${label}</span><b>${value === null ? '—' : value + suffix}</b></div>
        <div class="metric-bar"><i style="width:${value ?? 0}%"></i></div>
      </div>`

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
            <div class="grade"><b>${previewLevel}</b></div>
          </div>
          <div class="result-meta">
            <div>朗读 <b>${readSeg.seconds}</b> 秒 · 停顿 <b>${readSeg.pauses}</b> 次</div>
            <div>回答 <b>${answered}</b> / ${answers.length} 题达标（≥8 秒）</div>
            <div class="muted">评分来自：朗读准确度、停顿、语速、完成度</div>
          </div>
        </div>

        <div class="metrics">
          ${bar('朗读准确度', accuracy, '%')}
          ${bar('流利度（停顿）', fluency)}
          ${bar('语速', rate)}
          ${bar('完成度', completion)}
          ${assess ? bar('语法（模型）', assess.grammar) : ''}
          ${assess ? bar('词汇（模型）', assess.vocabulary) : ''}
          ${assess ? bar('连贯（模型）', assess.coherence) : ''}
        </div>

        <p class="ai-comment">${
          assess?.comment
            ? `📝 ${assess.comment.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c)}`
            : '这次没有拿到模型评分，上面是规则分（时长、停顿、语速、准确度）。'
        }</p>

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
          readingSeconds: readSeg.seconds,
          readingAccuracy: accuracy,
          readingWords: readSeg.words,
          answers: answers.map((a) => ({ seconds: a.seconds, words: a.words, pauses: a.pauses })),
          interests: pickedInterests,
          social,
          rhythm,
          selfDesc: selfInput?.value.trim() ?? '',
          assess: assess ? { level: assess.level, comment: assess.comment } : undefined,
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

  renderReading()

  window.addEventListener(
    'hashchange',
    () => {
      leaving = true
      stopCurrent?.()
      try {
        activeRecognition?.stop()
      } catch {
        // 忽略
      }
      cleanupRecording()
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
    },
    { once: true },
  )
}

/* ---------------- 小工具 ---------------- */

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: unknown) => void) | null
  onend: (() => void) | null
  onerror: ((event: unknown) => void) | null
}

let activeRecognition: SpeechRecognitionLike | null = null

const fmt = (sec: number): string =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

const wordsOf = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
