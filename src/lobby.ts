import './lobby.css'
import { api, type Partner } from './api'
import { currentUser, logout } from './auth'
import { clientId } from './client'
import { onLeave } from './lifecycle'

type Mode = 'chill' | 'stretch'

type Topic = {
  title: string
  en: string
  tips: { en: string; cn: string }[]
}

const me = currentUser()
const MY_LEVEL = me?.level ?? 'B1'
const MY_TAGS = me?.tags ?? []

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

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

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
        <div class="top-actions">
          <div class="menu" id="room-menu">
            <button class="pill-link" type="button" id="room-menu-btn">房间 ▾</button>
            <div class="menu-panel">
              <button type="button" data-room="create">创建房间</button>
              <button type="button" data-room="join">加入房间</button>
            </div>
          </div>
          <a class="pill-link" href="#/me">我的</a>
          <button class="link-quit" id="lobby-logout">退出</button>
        </div>
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

    <div class="mask" id="invite-mask" hidden>
      <div class="modal invite-modal">
        <h3>有人邀请你一起练</h3>
        <div id="invite-list"></div>
      </div>
    </div>

    <div class="mask" id="new-room-mask" hidden>
      <div class="modal new-room-modal">
        <h3>创建房间，想怎么聊？</h3>
        <div class="new-room-actions">
          <button class="btn" type="button" data-new-mode="chill">轻松闲聊</button>
          <button class="btn ghost" type="button" data-new-mode="stretch">挑战进阶</button>
        </div>
        <button class="link" type="button" id="new-room-cancel">取消</button>
      </div>
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
  const mask = $<HTMLDivElement>('#invite-mask')
  const inviteList = $<HTMLDivElement>('#invite-list')

  let mode: Mode | null = null
  let sec = 0
  let timer: number | undefined
  let refreshTimer: number | undefined
  let currentTopic = 0
  let offset = 0
  let total = 0
  let realCount = 0

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
    searchArea.innerHTML = `
      <div class="bar">
        <span class="search-dot"></span>
        <b>正在找「${MODE_NAME[mode]}」的语伴…</b>
        <span class="muted">已等待 <span id="wait">${sec}</span> 秒</span>
        <button class="btn ghost sm" type="button" id="cancel">取消匹配</button>
      </div>
      <p class="ai-hint" id="ai-hint" ${sec < 15 ? 'hidden' : ''}>
        还没找到合适的？<button class="link" type="button" id="ai">换 AI 练习 →</button>
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

  const drawResults = (list: Partner[]): void => {
    if (list.length === 0) {
      results.innerHTML = '<div class="empty-box">这个模式里现在没有人，等一会儿再试</div>'
      return
    }
    const fakeShown = list.length - realCount
    const canReshuffle = total > fakeShown

    results.innerHTML = `
      ${canReshuffle ? '<div class="results-bar"><button class="btn ghost sm" type="button" id="reshuffle">换一批</button></div>' : ''}
      <div class="grid-mates">
        ${list
          .map((p) => {
            const badge = p.online
              ? '<span class="shared">在线</span>'
              : mode === 'chill'
                ? `<span class="shared">共同标签 ${p.shared.length}</span>`
                : p.diff.length >= 2
                  ? `<span class="shared diff">话题差异 ${p.diff.length}</span>`
                  : p.diff.length === 1
                    ? `<span class="shared diff">新话题 ${p.diff[0]}</span>`
                    : '<span class="shared diff">等级更高</span>'
            const action = p.online
              ? `<button class="btn sm" type="button" data-invite-user="${p.name}">邀请</button>`
              : '<span class="muted">示例语伴</span>'
            return `
          <article class="mate">
            <div class="mate-head">
              <span class="ava" style="background:${p.color}">${p.name[0]}</span>
              <div><b>${p.name}</b><span class="muted">${p.level}</span></div>
              ${badge}
            </div>
            <div class="tags">
              ${p.tags.map((t) => `<span class="tag ${p.shared.includes(t) ? 'hit' : ''}">${t}</span>`).join('')}
            </div>
            <div class="mate-actions">${action}</div>
          </article>`
          })
          .join('')}
      </div>`

    results.querySelectorAll<HTMLButtonElement>('[data-invite-user]').forEach((btn) => {
      btn.onclick = async () => {
        if (!me) return
        btn.disabled = true
        btn.textContent = '邀请中…'
        const res = await api.inviteSend({
          fromAccount: me.account,
          fromClientId: clientId(),
          toAccount: btn.dataset.inviteUser ?? '',
          mode: mode ?? 'chill',
        })
        if (!res.ok) {
          btn.disabled = false
          btn.textContent = '邀请'
          results.insertAdjacentHTML('beforeend', `<div class="empty-box">${res.error}</div>`)
          return
        }
        location.hash = '#/wait/' + res.data.roomId
      }
    })

    const reshuffle = document.querySelector<HTMLButtonElement>('#reshuffle')
    if (reshuffle) reshuffle.onclick = () => void loadPartners(offset + 4)
  }

  const loadPartners = async (nextOffset: number): Promise<void> => {
    const target = mode
    if (!target || !me) return
    const res = await api.partners(me.account, target, MY_TAGS, MY_LEVEL, nextOffset)
    if (!mode || mode !== target) return
    if (!res.ok) {
      results.innerHTML = `<div class="empty-box">${res.error}</div>`
      return
    }
    total = res.data.total
    realCount = res.data.realCount
    offset = total ? nextOffset % total : 0
    drawResults(res.data.partners)
  }

  const publishMode = async (next: Mode | null): Promise<void> => {
    if (!me) return
    await api.presence({ account: me.account, clientId: clientId(), mode: next })
  }

  const startSearch = async (next: Mode): Promise<void> => {
    mode = next
    sec = 0
    stopTimer()
    stage.classList.add('is-searching')
    head.hidden = true
    modesEl.hidden = true
    drawSearch()
    results.innerHTML = ''

    const wait = document.querySelector<HTMLSpanElement>('#wait')
    if (wait) wait.textContent = '0'
    timer = window.setInterval(() => {
      sec++
      const el = document.querySelector<HTMLSpanElement>('#wait')
      if (el) el.textContent = String(sec)
      if (sec === 15) drawSearch()
    }, 1000)

    offset = 0
    total = 0
    realCount = 0
    await publishMode(next)
    await loadPartners(0)

    // 每 3 秒静默刷一次列表：让"刚点进这个模式的人"能出现在彼此列表里
    window.clearInterval(refreshTimer)
    refreshTimer = window.setInterval(() => {
      if (mode) void loadPartners(offset)
    }, 3000)
  }

  function cancelSearch(): void {
    stopTimer()
    window.clearInterval(refreshTimer)
    if (mode) void api.queueLeave({ mode, clientId: clientId() })
    mode = null
    sec = 0
    offset = 0
    total = 0
    realCount = 0
    searchArea.innerHTML = ''
    results.innerHTML = ''
    stage.classList.remove('is-searching')
    head.hidden = false
    modesEl.hidden = false
    void publishMode(null)
  }

  /* ---------------- 收到的邀请：居中弹窗，先处理它 ---------------- */

  const renderInvites = (list: { id: string; from: string; roomId: string; tags: string[] }[]): void => {
    if (!me) return
    if (list.length === 0) {
      mask.hidden = true
      inviteList.innerHTML = ''
      return
    }
    mask.hidden = false
    inviteList.innerHTML = list
      .map(
        (inv) => `
        <div class="invite-row" data-invite="${inv.id}">
          <b class="invite-name">${inv.from}</b>
          <div class="tags">
            ${inv.tags.map((t) => `<span class="tag ${MY_TAGS.includes(t) ? 'hit' : ''}">${t}</span>`).join('')}
          </div>
          <div class="invite-row-actions">
            <button class="btn sm" type="button" data-accept="${inv.id}">接受</button>
            <button class="btn ghost sm" type="button" data-decline="${inv.id}">拒绝</button>
          </div>
        </div>`,
      )
      .join('')

    inviteList.querySelectorAll<HTMLButtonElement>('[data-accept]').forEach((btn) => {
      btn.onclick = async () => {
        const r = await api.inviteRespond({
          inviteId: btn.dataset.accept ?? '',
          account: me.account,
          clientId: clientId(),
          accept: true,
        })
        if (r.ok && r.data.roomId) {
          mask.hidden = true
          location.hash = '#/room/' + r.data.roomId
        }
      }
    })
    inviteList.querySelectorAll<HTMLButtonElement>('[data-decline]').forEach((btn) => {
      btn.onclick = async () => {
        await api.inviteRespond({
          inviteId: btn.dataset.decline ?? '',
          account: me.account,
          clientId: clientId(),
          accept: false,
        })
        await pollInvites()
      }
    })
  }

  const pollInvites = async (): Promise<void> => {
    if (!me) return
    const res = await api.invites(me.account)
    if (!res.ok) return
    renderInvites(res.data.invites)
  }

  /* ---------------- 顶部「房间」下拉：移开 2 秒后才收，移到面板上不收 ---------------- */

  const menuEl = $<HTMLDivElement>('#room-menu')
  let menuTimer: number | undefined

  const openMenu = (): void => {
    window.clearTimeout(menuTimer)
    menuEl.classList.add('open')
  }

  const scheduleCloseMenu = (): void => {
    window.clearTimeout(menuTimer)
    menuTimer = window.setTimeout(() => menuEl.classList.remove('open'), 800)
  }

  const closeMenuNow = (): void => {
    window.clearTimeout(menuTimer)
    menuEl.classList.remove('open')
  }

  menuEl.addEventListener('mouseenter', openMenu)
  menuEl.addEventListener('mouseleave', scheduleCloseMenu)
  document.addEventListener('click', closeMenuNow)

  $<HTMLButtonElement>('#room-menu-btn').onclick = (e) => {
    e.stopPropagation()
    menuEl.classList.toggle('open')
  }

  const newRoomMask = $<HTMLDivElement>('#new-room-mask')

  document.querySelectorAll<HTMLButtonElement>('[data-room]').forEach((btn) => {
    btn.onclick = () => {
      if (btn.dataset.room === 'join') {
        location.hash = '#/join'
        return
      }
      newRoomMask.hidden = false
    }
  })

  newRoomMask.querySelectorAll<HTMLButtonElement>('[data-new-mode]').forEach((btn) => {
    btn.onclick = async () => {
      if (!me) return
      const res = await api.roomCreate({
        account: me.account,
        clientId: clientId(),
        mode: btn.dataset.newMode,
      })
      if (!res.ok) return
      newRoomMask.hidden = true
      location.hash = '#/room/' + res.data.roomId
    }
  })

  $<HTMLButtonElement>('#new-room-cancel').onclick = () => {
    newRoomMask.hidden = true
  }

  $<HTMLButtonElement>('#lobby-logout').onclick = () => {
    logout()
    location.hash = '#/login'
  }

  $<HTMLButtonElement>('#topic-next').onclick = () => {
    if (TOPICS.length < 2) return
    let next = currentTopic
    while (next === currentTopic) next = Math.floor(Math.random() * TOPICS.length)
    currentTopic = next
    drawTopic()
  }

  modesEl.querySelectorAll<HTMLButtonElement>('.mode').forEach((btn) => {
    btn.onclick = () => void startSearch((btn.dataset.mode as Mode) ?? 'chill')
  })

  // 心跳：告诉服务器我现在在哪个模式（不点模式就 mode=null，不出现在别人列表里）
  const hbTimer = window.setInterval(() => void publishMode(mode), 3000)
  const ivTimer = window.setInterval(() => void pollInvites(), 2000)
  void publishMode(null)
  void pollInvites()

  onLeave(() => {
    window.clearInterval(hbTimer)
    window.clearInterval(ivTimer)
    window.clearInterval(refreshTimer)
    window.clearTimeout(menuTimer)
    document.removeEventListener('click', closeMenuNow)
    menuEl.removeEventListener('mouseenter', openMenu)
    menuEl.removeEventListener('mouseleave', scheduleCloseMenu)
    stopTimer()
    void publishMode(null)
  })
}
