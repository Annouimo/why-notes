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

远程首次构建、域名和 HTTPS 验证结果在实际完成后补充。
