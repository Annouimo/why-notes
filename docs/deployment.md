# 发布配置与验证

- Worker：why-notes（生产与所有分支 Preview 共用）
- 生产域名：learn.annouimo.com
- 预览域名：<preview-slug>.learn.annouimo.com
- 仓库：Annouimo/why-notes
- Cloudflare Workers Builds：main 使用 npm run deploy；其他分支使用 npm run deploy:preview；两者先运行 npm run check。
- Node.js 24；cf 版本由 package-lock.json 固定。
- Workers Static Assets：Astro 构建输出，不再将资源打包到 JavaScript 中。
- 预览返回 noindex，生产构建不生成草稿 URL。
- 不提交访问凭据。构建使用账户中已有的 Workers Builds token 引用，源码不保存 token 值。

## 本地验证

2026-11-14：类型检查无错误，11 项测试通过；cf deploy --dry-run 成功，生产仅生成首页，使用 Static Assets。

## 远程验证与待完成项

2026-11-14：

- 提交 d6ceb6fec160e35760d700c3312fc5a099aea85e 自动触发 Workers Builds（push_event），构建 b822871a-5706-407d-abcb-9eced67b3285 成功。类型检查与 11 项测试通过。
- 原生 Preview ID：917d10fe081542baa93eb66b04878d58；部署 ID：257081d2-6a88-4885-9ab9-65699195934f。
- 原生预览讲义 HTTP 200，包含草稿和 noindex；使用 Static Assets。
- 可访问预览：https://feat-uniform-continuity-preview-why-notes.keen18906416.workers.dev/notes/uniform-continuity/
- 首次生产构建 c334e274-5ba6-46e4-be31-77eb6d6092f2 已完成检查和首页构建，但部署被 cf 的旧脚本 API 上传冲突保护中止，尚未创建生产 deployment。
- 本地产物核对：仅 index.html；没有讲义 HTML、讲义链接，首页显示“第一篇讲义正在制作中”。
- 用户于 2026-11-14 明确允许首次生产接管，并要求不影响其他 Worker。
- 首次生产部署已成功：构建 90ba02b7-d296-4192-9656-b3cd9d37aea1；生产版本 7907ecb1-0c86-4f6f-9566-2ed238c4dd7b；deployment 7ea6fcb7-d525-435f-a926-0899b461c50d。
- 仅这次构建使用 npx cf deploy --force，后续生产触发器已恢复 npm run deploy。
- learn.annouimo.com 已绑定 why-notes，enabled=true、previews_enabled=true；原生 Preview 已列出自定义域名地址。
- 正式首页 HTTPS 200，显示“第一篇讲义正在制作中”；正式讲义 URL 返回 404。
- 博客与陈列室部署前后均为 HTTP 200，域名绑定未变化。
- main 未合并；讲义仍为 draft: true。
- 预览子域名最初返回 503；证书已于同日变为 active，讲义 HTTPS 200，CSS、交互脚本、KaTeX 字体均为 200。
- 预览域名响应头规则改用 :preview 占位符，避免同一规则包含两个 splat。

## 后续发布检查

使用正常生产构建（排除草稿）创建 deployment；域名同时启用 production 与 previews。检查生产首页 200、草稿地址 404、分支自定义域名讲义 200、预览响应 noindex、字体和脚本 200。后续发布无需 --force。

