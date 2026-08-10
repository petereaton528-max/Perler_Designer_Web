import { StaticPageLayout } from './StaticPageLayout'

export function AboutPage() {
  return (
    <StaticPageLayout title="关于 Perler Designer" eyebrow="ABOUT">
      <p>Perler Designer 是一个免费的在线拼豆图案生成工具，帮助拼豆爱好者把照片和插画转换成可制作的拼豆网格。</p>
      <h2>可以做什么</h2>
      <p>你可以在浏览器中导入图片、设置网格与颜色数量、匹配拼豆色卡、手工编辑格子、统计用量，并生成拼板分页、PNG 图片和 A4 PDF 图纸。</p>
      <h2>我们的原则</h2>
      <p>工具无需登录、没有会员或付费墙。核心图片处理直接在你的浏览器中进行，网站不需要服务器代为计算。</p>
      <p><a className="static-action" href="/">开始制作拼豆图案</a></p>
    </StaticPageLayout>
  )
}
