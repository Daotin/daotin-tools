import { Component } from 'react'
import { Button } from './ui/button'

/**
 * 兜住渲染期抛出的异常。最常见的是发了新版之后，旧页面去加载已经不存在的 chunk，
 * 这种情况刷新一次就好，所以卡片上只给一个"刷新"。
 */
export class ErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="rounded-md bg-surface p-5">
        <div className="text-heading">页面加载失败</div>
        <Button className="mt-4" onClick={() => location.reload()}>
          刷新
        </Button>
      </div>
    )
  }
}
