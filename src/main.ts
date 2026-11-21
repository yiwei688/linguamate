import './style.css'
import { currentUser, login, register } from './auth'
import { lobbyView, mountLobby } from './lobby'

const app = document.querySelector<HTMLDivElement>('#app')!

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
let captcha = ''

function makeCaptcha(): void {
  captcha = Array.from({ length: 4 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('')
}

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

function showErr(el: HTMLElement, msg: string | null): void {
  if (msg) {
    el.textContent = msg
    el.hidden = false
  } else {
    el.textContent = ''
    el.hidden = true
  }
}

/* ---------------- 视图 ---------------- */

function loginView(): string {
  return `
  <div class="page">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="card">
      <h1>登录</h1>
      <p class="sub">和语伴练口语，从一次开口开始</p>
      <form id="login-form" novalidate>
        <label class="field">账号
          <input id="l-account" type="text" placeholder="请输入账号" autocomplete="username" />
        </label>
        <label class="field">密码
          <input id="l-pass" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </label>
        <p class="err" id="l-err" hidden></p>
        <button class="btn" type="submit">登录</button>
        <div class="row">
          <button class="link" type="button" id="l-forgot">忘记密码</button>
          <a class="link" href="#/register">注册</a>
        </div>
        <p class="note" id="l-note" hidden>重置密码功能暂未开放</p>
      </form>
    </div>
  </div>`
}

function registerView(): string {
  return `
  <div class="page">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="card">
      <h1>注册</h1>
      <p class="sub">30 秒建个账号，马上开始定级</p>
      <form id="reg-form" novalidate>
        <label class="field">账号
          <input id="r-account" type="text" placeholder="2–20 位字母、数字或下划线" autocomplete="username" />
        </label>
        <label class="field">密码
          <input id="r-pass" type="password" placeholder="至少 6 位" autocomplete="new-password" />
        </label>
        <label class="field">再次输入密码
          <input id="r-pass2" type="password" placeholder="再输一次" autocomplete="new-password" />
        </label>
        <label class="field">手机号
          <input id="r-phone" type="tel" placeholder="11 位手机号" autocomplete="tel" />
        </label>
        <label class="field">邮箱
          <input id="r-email" type="email" placeholder="you@example.com" autocomplete="email" />
        </label>
        <label class="field">验证码
          <div class="code-row">
            <input id="r-code" type="text" placeholder="输入右侧 4 位" maxlength="4" autocomplete="off" />
            <button class="code" type="button" id="r-refresh" title="点一下换一个">${captcha}</button>
          </div>
        </label>
        <p class="err" id="r-err" hidden></p>
        <button class="btn" type="submit">注册并登录</button>
        <div class="row"><a class="link" href="#/login">已有账号，去登录</a></div>
      </form>
    </div>
  </div>`
}

/* ---------------- 挂载 ---------------- */

function mountLogin(): void {
  const form = $<HTMLFormElement>('#login-form')
  const err = $<HTMLParagraphElement>('#l-err')

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const account = $<HTMLInputElement>('#l-account').value.trim()
    const password = $<HTMLInputElement>('#l-pass').value
    if (!account || !password) return showErr(err, '请输入账号和密码')
    const res = login(account, password)
    if (!res.ok) return showErr(err, res.msg)
    location.hash = '#/app'
  })

  $<HTMLButtonElement>('#l-forgot').addEventListener('click', () => {
    $<HTMLParagraphElement>('#l-note').hidden = false
  })
}

function mountRegister(): void {
  const form = $<HTMLFormElement>('#reg-form')
  const err = $<HTMLParagraphElement>('#r-err')

  $<HTMLButtonElement>('#r-refresh').addEventListener('click', () => {
    makeCaptcha()
    $<HTMLButtonElement>('#r-refresh').textContent = captcha
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const account = $<HTMLInputElement>('#r-account').value.trim()
    const password = $<HTMLInputElement>('#r-pass').value
    const password2 = $<HTMLInputElement>('#r-pass2').value
    const phone = $<HTMLInputElement>('#r-phone').value.trim()
    const email = $<HTMLInputElement>('#r-email').value.trim()
    const code = $<HTMLInputElement>('#r-code').value.trim()

    if (!/^[A-Za-z0-9_]{2,20}$/.test(account)) return showErr(err, '账号要 2–20 位字母、数字或下划线')
    if (password.length < 6) return showErr(err, '密码至少 6 位')
    if (password !== password2) return showErr(err, '两次输入的密码不一致')
    if (!/^1[3-9]\d{9}$/.test(phone)) return showErr(err, '手机号格式不对')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr(err, '邮箱格式不对')
    if (code.toUpperCase() !== captcha) return showErr(err, '验证码不对')

    const res = register({ account, password, phone, email })
    if (!res.ok) return showErr(err, res.msg)
    location.hash = '#/app'
  })
}

/* ---------------- 路由 ---------------- */

function render(html: string, mount: () => void): void {
  app.innerHTML = html
  mount()
}

function route(): void {
  const path = location.hash.replace(/^#\/?/, '') || 'login'

  if (path === 'register') {
    makeCaptcha()
    render(registerView(), mountRegister)
    return
  }

  if (path === 'app') {
    if (!currentUser()) {
      location.hash = '#/login'
      return
    }
    render(lobbyView(), mountLobby)
    return
  }

  render(loginView(), mountLogin)
}

window.addEventListener('hashchange', route)
route()
