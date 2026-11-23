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

function profileHtml(data: Profile): string {
  const user = data.user
  const last = data.recent.length ? mmdd(data.recent[0].at) : '—'

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
      ${practiceList(data.recent)}
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
    body.innerHTML = profileHtml(res.data)
  }

  void load()
}
