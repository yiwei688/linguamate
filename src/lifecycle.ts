// 页面切换时，把上一个页面留下的定时器清掉。
// 不这么做，你每进一次大厅就多一个轮询，越用越卡。
type Cleanup = () => void

let pending: Cleanup[] = []

export function onLeave(fn: Cleanup): void {
  pending.push(fn)
}

export function runCleanups(): void {
  for (const fn of pending) {
    try {
      fn()
    } catch {
      // 清理失败不该挡住后续渲染
    }
  }
  pending = []
}
