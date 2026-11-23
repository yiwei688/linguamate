// 每个浏览器标签页一个独立身份：用来区分"我是房主"还是"我是来客"。
// 放在 sessionStorage 里，所以同一个账号开两个无痕/普通窗口也不会打架。
const KEY = 'lm.client'

export function clientId(): string {
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(KEY, id)
  }
  return id
}
