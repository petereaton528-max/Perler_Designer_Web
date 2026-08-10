import type { ReactNode } from 'react'
import './pages.css'

interface StaticPageLayoutProps { readonly title: string; readonly eyebrow: string; readonly children: ReactNode }

export function StaticPageLayout({ title, eyebrow, children }: StaticPageLayoutProps) {
  return (
    <main className="static-shell">
      <header className="static-header">
        <a className="static-brand" href="/">Perler Designer</a>
        <nav aria-label="网站导航"><a href="/">工具</a><a href="/about">关于</a><a href="/privacy">隐私</a></nav>
      </header>
      <article className="static-page">
        <p className="static-eyebrow">{eyebrow}</p><h1>{title}</h1>{children}
      </article>
      <footer className="static-footer">perlerdesigner.xyz · 免费 · 本地处理 · 无需登录</footer>
    </main>
  )
}
