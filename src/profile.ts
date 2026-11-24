import './profile.css'
import { api, type Profile, type PracticeItem } from './api'
import { currentUser, logout } from './auth'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

// 语伴的颜色存在数据库里，用户没有；头像色块按账号固定算一个，刷新也不变
const AVA_COLORS = ['#7c6cf6', '#12b3a6', '#ff6b4a', '#f0a91b', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']

function avaColor(account: string): string {
  let sum = 0
  for (const ch of account) sum += ch.charCodeAt(0)
  return AVA_COLORS[sum % AVA_COLORS.length]
}

function mmdd(at: number): string {
  const d = new Date(at)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 每条记录一行：日期 / 语伴 / 闲聊-进阶 / 分钟；标签另起一行，突出这次聊的是什么 */
function practiceList(recent: PracticeItem[]): string {
  if (recent.length === 0) {
    return '<div class="empty-box">还没有练习记录，去大厅找一个语伴吧</div>'
  }

  const items: string[] = []
  let lastYear = -1

  for (const r of recent.slice(0, 20)) {
    const year = new Date(r.at).getFullYear()
    if (year !== lastYear) {
      items.push(`<li class="year-row">${year} 年</li>`)
      lastYear = year
    }
    const mode =
      r.mode === 'chill'
        ? '<span class="mode-badge chill">闲聊</span>'
        : r.mode === 'stretch'
          ? '<span class="mode-badge stretch">进阶</span>'
          : ''
    items.push(`<li class="p-row">
      <span class="r-date">${mmdd(r.at)}</span>
      <span class="r-who">${r.partner}</span>
      ${mode}
      <span class="r-min ${r.minutes < 3 ? 'short' : ''}">${r.minutes} 分钟</span>
      <span class="r-tags">${r.tags.map((t) => `<i>${t}</i>`).join('')}</span>
    </li>`)
  }

  return `<ul class="recent-list">${items.join('')}</ul>`
}

const SHORT: Record<string, string> = {
  电影迷: '影视',
  科技控: '科技',
  旅行党: '旅行',
  社会派: '社会',
  音乐虫: '音乐',
  美食家: '美食',
  游戏党: '游戏',
  读书人: '读书',
}

/** 话题分布雷达：维度 = 你聊过的标签，半径 = 花在那个话题上的分钟数 */
function radarSvg(items: { tag: string; minutes: number }[]): string {
  const n = items.length
  const S = 300
  const C = 150
  const R = 100
  const max = Math.max(...items.map((t) => t.minutes), 1)

  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [C + Math.cos(a) * r, C + Math.sin(a) * r]
  }

  const rings = [0.25, 0.5, 0.75, 1]
    .map(
      (k) =>
        `<polygon points="${items.map((_, i) => pt(i, R * k).join(',')).join(' ')}" fill="none" stroke="#e6e7eb" />`,
    )
    .join('')
  const axes = items
    .map((_, i) => {
      const [x, y] = pt(i, R)
      return `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" stroke="#e6e7eb" />`
    })
    .join('')
  const radii = items.map((t) => (t.minutes > 0 ? Math.max(R * 0.1, (t.minutes / max) * R) : 0))
  const poly = items.map((_, i) => pt(i, radii[i]).join(',')).join(' ')
  const dots = items
    .map((_, i) => {
      const [x, y] = pt(i, radii[i])
      return `<circle cx="${x}" cy="${y}" r="3" fill="#12b3a6" />`
    })
    .join('')
  const labels = items
    .map((t, i) => {
      const [x, y] = pt(i, R + 26)
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#6b7280">${SHORT[t.tag] ?? t.tag}</text>`
    })
    .join('')

  return `<svg class="radar" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${rings}${axes}
    <polygon points="${poly}" fill="rgba(18,179,166,0.16)" stroke="#12b3a6" stroke-width="2" stroke-linejoin="round" />
    ${dots}${labels}
  </svg>`
}

function growthBlock(topics: { tag: string; minutes: number }[]): string {
  if (topics.length === 0) {
    return '<div class="empty-box">还没有练习记录，聊过一次就会有图</div>'
  }
  if (topics.length < 3) {
    return `<ul class="topic-bars">${topics
      .map((t) => `<li><span>${t.tag}</span><b>${t.minutes} 分钟</b></li>`)
      .join('')}</ul>`
  }
  const top = topics.slice(0, 3).map((t) => `${t.tag} ${t.minutes}′`).join(' · ')
  return `<div class="radar-wrap">${radarSvg(topics)}</div><p class="topic-top">聊得最多：${top}</p>`
}

function profileHtml(data: Profile): string {
  const user = data.user
  // 兜底：接口少字段时页面降级，而不是整页停在"正在加载"
  const recent = data.recent ?? []
  const topics = data.topics ?? []
  const badges = data.badges ?? []
  const last = recent.length ? mmdd(recent[0].at) : '—'

  return `
    <section class="card pcard">
      <div class="pcard-head">
        <span class="ava big" style="background:${avaColor(user.account)}">${user.account[0]}</span>
        <div class="pcard-who">
          <h1>${user.account}</h1>
          <span class="level-badge">${user.level}</span>
        </div>
      </div>

      <div class="tags">
        ${user.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
      </div>

      <div class="stats">
        <div class="stat"><b>${data.stats.totalMinutes}</b><span>累计练习分钟</span></div>
        <div class="stat"><b>${data.stats.sessions}</b><span>练习次数</span></div>
        <div class="stat"><b>${last}</b><span>最近一次</span></div>
      </div>
    </section>

    <section class="card recent">
      <h2>最近练习</h2>
      ${practiceList(recent)}
    </section>

    <section class="card growth">
      <h2>成长图谱</h2>
      <p class="sub">按聊过的话题统计（分钟）</p>
      ${growthBlock(topics)}
    </section>

    <section class="card badges-card">
      <h2>成就墙</h2>
      <div class="badge-grid">
        ${badges
          .map(
            (b) =>
              `<div class="badge ${b.unlocked ? '' : 'lock'}"><b>${b.title}</b><span>${
                b.unlocked ? '已解锁' : '未解锁'
              }</span></div>`,
          )
          .join('')}
      </div>
    </section>`
}

export function profileView(): string {
  const me = currentUser()
  return `
  <div class="profile">
    <div class="profile-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions">
        <a class="pill-link" href="#/app">返回大厅</a>
        <button class="link-quit" type="button" id="profile-logout">退出</button>
      </div>
    </div>

    <div id="profile-body">
      ${
        me
          ? '<div class="card"><div class="empty-box">正在加载…</div></div>'
          : '<div class="card"><div class="empty-box">未登录</div></div>'
      }
    </div>
  </div>`
}

export function mountProfile(): void {
  const body = $<HTMLDivElement>('#profile-body')
  const me = currentUser()

  $<HTMLButtonElement>('#profile-logout').onclick = () => {
    logout()
    location.hash = '#/login'
  }

  // 没登录就不请求，只显示「未登录」
  if (!me) return

  const load = async (): Promise<void> => {
    const res = await api.profile(me.account)
    if (!res.ok) {
      body.innerHTML = `<div class="card"><div class="empty-box">${res.error}</div></div>`
      return
    }
    try {
      body.innerHTML = profileHtml(res.data)
    } catch (err) {
      // 渲染出错也要给个交代，不能一直停在"正在加载"
      console.error('[profile] 渲染失败', err)
      body.innerHTML =
        '<div class="card"><div class="empty-box">页面数据不完整，刷新试试；还不行就把这里的情况告诉开发者</div></div>'
    }
  }

  void load()
}
