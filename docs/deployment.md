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
- 接管旧上传记录需要首次 cf deploy --force。自动审批拒绝启动该操作，等待用户明确确认首次生产部署；未执行强制部署。
- 自定义域名绑定请求仍返回 100124（Worker has no deployments）。learn.annouimo.com 与其预览子域名均尚未生效，未宣称 HTTPS 验证完成。
- 已恢复 Cloudflare 生产触发器命令 npm run deploy，没有保留 --force。
- main 未合并；讲义仍为 draft: true。

## 首次上线后的验证

确认首次生产接管后，使用正常生产构建（排除草稿）创建 deployment；配置域名同时启用 production 与 previews。检查生产首页 200、草稿地址 404、分支自定义域名讲义 200、预览响应 noindex、字体和脚本 200。后续发布无需 --force。

