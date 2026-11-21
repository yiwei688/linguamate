import './lobby.css'
import { currentUser, logout } from './auth'

type Mode = 'chill' | 'stretch'

type Partner = {
  name: string
  level: string
  tags: string[]
  color: string
}

type Topic = {
  title: string
  en: string
  tips: { en: string; cn: string }[]
}

// 定级还没做，我的标签和等级先用默认值占位（阶段 5 换成真实画像）
const MY_TAGS = ['电影迷', '慢热型']
const MY_LEVEL = 'B1'

const LEVEL_RANK: Record<string, number> = { A2: 1, B1: 2, B2: 3 }

const TOPICS: Topic[] = [
  {
    title: '最近一件让你开心的小事',
    en: 'A small thing that made your day',
    tips: [
      { en: 'Honestly, the smallest thing made my day yesterday.', cn: '说真的，昨天一件极小的事让我开心了一整天。' },
      { en: "It's nothing special, but it still makes me smile.", cn: '没什么特别的，但想起来还是会笑。' },
      { en: 'I guess small things hit harder than big ones.', cn: '我觉得小事反而比大事更打动人。' },
      { en: 'I almost missed it, but then I noticed and felt great.', cn: '我差点错过，但注意到之后心情特别好。' },
    ],
  },
  {
    title: '你最近在追的剧或游戏',
    en: 'What you are binge-watching lately',
    tips: [
      { en: "I'm three episodes in and already hooked.", cn: '我才看了三集就已经上头了。' },
      { en: 'The plot is simple, but the acting carries it.', cn: '剧情一般，但演技撑住了。' },
      { en: "I'd recommend it if you like slow stories.", cn: '如果你喜欢慢节奏的故事，我推荐。' },
      { en: 'No spoilers, I promise.', cn: '放心，我不剧透。' },
    ],
  },
  {
    title: '如果能立刻去一个地方',
    en: 'One place you would go tomorrow',
    tips: [
      { en: 'If I could teleport, I would be on a beach right now.', cn: '要是能瞬移，我现在就在海滩上了。' },
      { en: 'I have been saving a trip for months.', cn: '我为一个旅行攒了好几个月的钱。' },
      { en: 'I prefer small towns to big cities.', cn: '比起大城市，我更喜欢小镇。' },
      { en: 'The food is honestly half the reason.', cn: '说真的，吃占了一半的理由。' },
    ],
  },
]

const PARTNERS: Partner[] = [
  { name: 'Mia', level: 'B1', tags: ['电影迷', '倾听者'], color: '#7c6cf6' },
  { name: 'Leo', level: 'B1', tags: ['科技控', '破冰者'], color: '#12b3a6' },
  { name: 'Sara', level: 'B2', tags: ['社会派', '深聊派'], color: '#ff6b4a' },
  { name: 'Ken', level: 'A2', tags: ['旅行党', '慢热型'], color: '#f0a91b' },
  { name: 'Ivy', level: 'B1', tags: ['电影迷', '深聊派'], color: '#0ea5e9' },
  { name: 'Noah', level: 'B2', tags: ['科技控', '短平快'], color: '#8b5cf6' },
  { name: 'Zoe', level: 'A2', tags: ['旅行党', '破冰者'], color: '#ef4444' },
  { name: 'Tom', level: 'B2', tags: ['社会派', '倾听者'], color: '#14b8a6' },
]

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

function sharedTags(p: Partner): string[] {
  return p.tags.filter((t) => MY_TAGS.includes(t))
}

/** 轻松 = 标签有交集；进阶 = 标签没交集，或者等级比我高（两种都算“进阶”） */
function partnersFor(mode: Mode): Partner[] {
  return PARTNERS.filter((p) => {
    const shared = sharedTags(p).length
    if (mode === 'chill') return shared > 0
    return shared === 0 || (LEVEL_RANK[p.level] ?? 0) > (LEVEL_RANK[MY_LEVEL] ?? 0)
  })
}

const MODE_NAME: Record<Mode, string> = {
  chill: '轻松闲聊',
  stretch: '挑战进阶',
}

function topicHtml(topic: Topic): string {
  return `
    <div class="topic-head">
      <span class="badge">今日推荐话题</span>
      <h2>${topic.title}</h2>
      <p class="sub">${topic.en}</p>
    </div>
    <ul class="tips">
      ${topic.tips.map((t) => `<li><b>${t.en}</b><span>${t.cn}</span></li>`).join('')}
    </ul>`
}

export function lobbyView(): string {
  const user = currentUser()
  return `
  <div class="lobby">
    <div class="lobby-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="lobby-who">
        <span>${user?.account ?? '未登录'}</span>
        <span class="dot-sep">·</span>
        <span>${MY_LEVEL}</span>
        <button class="link" id="lobby-logout">退出</button>
      </div>
    </div>

    <div class="hall">
      <section class="stage" id="stage">
        <div class="stage-head" id="stage-head">
          <h2>今天想怎么聊？</h2>
          <p class="sub">选一个，系统马上开始配对</p>
        </div>

        <div class="modes" id="modes">
          <button class="mode" type="button" data-mode="chill">
            <span class="mode-name">轻松闲聊</span>
            <span class="mode-desc">和标签有交集的人聊今天的话题</span>
          </button>
          <span class="or">或</span>
          <button class="mode" type="button" data-mode="stretch">
            <span class="mode-name">挑战进阶</span>
            <span class="mode-desc">换一个完全不同的话题，逼自己换频道</span>
          </button>
        </div>

        <div id="search-area"></div>
        <div id="results"></div>
      </section>

      <aside class="side">
        <section class="card topic">
          <div id="topic-box">${topicHtml(TOPICS[0])}</div>
          <div class="topic-foot">
            <button class="btn ghost sm" type="button" id="topic-next">换个话题</button>
          </div>
        </section>
      </aside>
    </div>
  </div>`
}

export function mountLobby(): void {
  const stage = $<HTMLElement>('#stage')
  const head = $<HTMLDivElement>('#stage-head')
  const modesEl = $<HTMLDivElement>('#modes')
  const searchArea = $<HTMLDivElement>('#search-area')
  const results = $<HTMLDivElement>('#results')
  const topicBox = $<HTMLDivElement>('#topic-box')

  let mode: Mode | null = null
  let sec = 0
  let timer: number | undefined
  let invited = ''
  let currentTopic = 0

  const stopTimer = (): void => {
    if (timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }

  const drawTopic = (): void => {
    topicBox.innerHTML = topicHtml(TOPICS[currentTopic])
  }

  const drawSearch = (): void => {
    if (!mode) {
      searchArea.innerHTML = ''
      return
    }

    if (invited) {
      searchArea.innerHTML = `
        <div class="bar">
          <span class="search-dot"></span>
          <b>已邀请 ${invited}</b>
          <span class="muted">等 TA 接受…（进房间还没做）</span>
          <button class="btn ghost sm" type="button" id="cancel">取消并返回</button>
        </div>`
      $<HTMLButtonElement>('#cancel').onclick = cancelSearch
      return
    }

    searchArea.innerHTML = `
      <div class="bar">
        <span class="search-dot"></span>
        <b>正在找「${MODE_NAME[mode]}」的语伴…</b>
        <span class="muted">已等待 <span id="wait">${sec}</span> 秒</span>
        <button class="btn ghost sm" type="button" id="cancel">取消匹配</button>
      </div>
      <p class="ai-hint" id="ai-hint" ${sec < 15 ? 'hidden' : ''}>
        还没找到真人？<button class="link" type="button" id="ai">换 AI 练习 →</button>
      </p>`

    $<HTMLButtonElement>('#cancel').onclick = cancelSearch
    $<HTMLButtonElement>('#ai').onclick = () => {
      stopTimer()
      searchArea.innerHTML =
        '<div class="bar"><span class="search-dot"></span><b>AI 练习还没做</b><span class="muted">等语音室那阶段接进来</span><button class="btn ghost sm" type="button" id="cancel">返回</button></div>'
      $<HTMLButtonElement>('#cancel').onclick = cancelSearch
      results.innerHTML = ''
    }
  }

  const drawResults = (): void => {
    if (!mode) {
      results.innerHTML = ''
      return
    }
    const list = partnersFor(mode).slice(0, 4)
    const current = mode
    if (list.length === 0) {
      results.innerHTML = '<div class="empty-box">这类人现在都不在线，换个模式试试</div>'
      return
    }
    results.innerHTML = `
      <div class="grid-mates">
        ${list
          .map((p) => {
            const shared = sharedTags(p)
            const diff = p.tags.filter((t) => !MY_TAGS.includes(t))
            const badge =
              current === 'chill'
                ? `<span class="shared">共同标签 ${shared.length}</span>`
                : diff.length >= 2
                  ? `<span class="shared diff">话题差异 ${diff.length}</span>`
                  : diff.length === 1
                    ? `<span class="shared diff">新话题 ${diff[0]}</span>`
                    : '<span class="shared diff">等级更高</span>'
            return `
          <article class="mate">
            <div class="mate-head">
              <span class="ava" style="background:${p.color}">${p.name[0]}</span>
              <div><b>${p.name}</b><span class="muted">${p.level}</span></div>
              ${badge}
            </div>
            <div class="tags">
              ${p.tags.map((t) => `<span class="tag ${shared.includes(t) ? 'hit' : ''}">${t}</span>`).join('')}
            </div>
            <div class="mate-actions">
              <button class="btn sm ${invited === p.name ? 'ghost' : ''}" type="button" data-invite="${p.name}"
                ${invited === p.name ? 'disabled' : ''}>${invited === p.name ? '已邀请' : '邀请'}</button>
            </div>
          </article>`
          })
          .join('')}
      </div>`

    results.querySelectorAll<HTMLButtonElement>('[data-invite]').forEach((btn) => {
      btn.onclick = () => {
        invited = btn.dataset.invite ?? ''
        stopTimer()
        drawSearch()
        drawResults()
      }
    })
  }

  const startSearch = (next: Mode): void => {
    mode = next
    sec = 0
    invited = ''
    stopTimer()
    stage.classList.add('is-searching')
    head.hidden = true
    modesEl.hidden = true
    drawSearch()
    drawResults()
    const wait = document.querySelector<HTMLSpanElement>('#wait')
    if (wait) wait.textContent = '0'
    timer = window.setInterval(() => {
      sec++
      const el = document.querySelector<HTMLSpanElement>('#wait')
      if (el) el.textContent = String(sec)
      if (sec === 15) drawSearch()
    }, 1000)
  }

  function cancelSearch(): void {
    stopTimer()
    mode = null
    sec = 0
    invited = ''
    searchArea.innerHTML = ''
    results.innerHTML = ''
    stage.classList.remove('is-searching')
    head.hidden = false
    modesEl.hidden = false
  }

  $<HTMLButtonElement>('#lobby-logout').onclick = () => {
    logout()
    location.hash = '#/login'
  }

  $<HTMLButtonElement>('#topic-next').onclick = () => {
    // 随机换，且不会连着抽到同一个；不显示总数，免得像“库里只有 3 条”
    if (TOPICS.length < 2) return
    let next = currentTopic
    while (next === currentTopic) next = Math.floor(Math.random() * TOPICS.length)
    currentTopic = next
    drawTopic()
  }

  modesEl.querySelectorAll<HTMLButtonElement>('.mode').forEach((btn) => {
    btn.onclick = () => startSearch((btn.dataset.mode as Mode) ?? 'chill')
  })
}
