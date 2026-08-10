# Perler Designer Web

面向 `perlerdesigner.xyz` 的免费在线拼豆设计工具。无需登录、无需服务器计算，用户图片和项目数据默认只在浏览器本地处理。

## 核心原则

- 图片通过浏览器 File API 读取，不上传到服务器。
- 图片处理、颜色匹配、网格绘制和导出均优先在浏览器本地完成。
- 不提供账号、会员或支付系统。
- 项目保存后续使用 IndexedDB；静态站点本身不依赖后端。
- 后续仅预留自愿“支持作者/赞助”入口。

## 技术栈

- TypeScript
- React 19
- Vite
- 原生 CSS
- Canvas API（后续网格渲染与图片处理）
- File API / Object URL（本地图片预览）
- IndexedDB（项目保存预留）
- 前端 PDF 库（后续选择与接入）

## 架构

```text
src/
├─ core/       纯领域模型与跨模块类型
├─ image/      本地图片解码、裁剪与变换
├─ palette/    品牌色卡与颜色匹配
├─ grid/       像素化、拼板布局、Canvas 网格与编辑
├─ export/     PNG 与未来的浏览器端 PDF 导出
├─ project/    项目模型与 IndexedDB 仓库接口
├─ ui/         可复用 React 展示组件
├─ App.tsx     当前基础首页
└─ main.tsx    应用入口
```

依赖方向保持为：UI 调用功能模块，功能模块依赖 `core`；`core` 不依赖 React、DOM 或存储实现。

## 当前功能

- 基础响应式首页
- JPG、PNG、WebP 本地文件选择
- 浏览器本地解码，处理 Bitmap 最长边限制为 2048 px
- 40×40、80×80 与 1–200 自定义尺寸像素化
- 16、32、48 色确定性 K-Means 颜色减少
- 开发测试色卡与示例迷你色卡 RGB 最近色匹配
- 单个 Canvas 绘制像素颜色与基础网格线
- 使用 Object URL 在浏览器中预览原图
- 更换或离开页面时释放 Object URL
- 基础拼豆领域数据模型

当前没有颜色统计、网格编辑、拼板分页、PDF 导出或项目持久化逻辑。

## 开发路线

1. 图片裁剪、旋转与缩放
2. 扩充真实品牌色卡数据
3. 网格编辑、撤销与重做
4. 拼板分页与颜色统计
5. IndexedDB 本地项目保存和格式迁移
6. PNG 与客户端 PDF 导出
7. 静态站点部署、隐私说明和可选赞助入口

## 本地运行

要求 Node.js 20.19+ 或 22.12+，推荐使用 pnpm。

```bash
pnpm install
pnpm dev
```

开发服务器默认地址由 Vite 输出，通常为 `http://localhost:5173`。

## 构建与预览

```bash
pnpm build
pnpm preview
```

生产文件输出到 `dist/`，可部署到任意静态网站托管平台。
