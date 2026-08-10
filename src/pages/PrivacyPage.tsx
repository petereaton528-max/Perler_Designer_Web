import { StaticPageLayout } from './StaticPageLayout'

export function PrivacyPage() {
  return (
    <StaticPageLayout title="隐私说明" eyebrow="PRIVACY">
      <p>Perler Designer 的图片处理设计遵循本地优先原则。</p>
      <h2>图片只在浏览器中处理</h2>
      <p>你选择的图片由当前设备上的浏览器读取、解码、像素化和导出，不会为了生成拼豆图案而上传到服务器。</p>
      <h2>我们不收集用户图片</h2>
      <p>网站不会收集、保存或查看你导入的图片。项目保存功能使用当前浏览器设备的 IndexedDB，本地项目不会自动同步到其他设备。</p>
      <h2>清除本地数据</h2>
      <p>你可以在项目列表中删除项目，也可以通过浏览器的网站数据设置清除 Perler Designer 保存在本机的数据。</p>
      <p><a className="static-action" href="/">返回拼豆工具</a></p>
    </StaticPageLayout>
  )
}
