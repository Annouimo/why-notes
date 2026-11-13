import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const [slug, title] = process.argv.slice(2);
if (!slug || !title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('用法：npm run new:note -- topic-slug "讲义标题"'); process.exit(1);
}
const root = resolve(import.meta.dirname, '..');
const directory = resolve(root, 'src/content/notes', slug);
try { await access(directory); console.error('该讲义已存在，不会覆盖。'); process.exit(1); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'index.mdx'), `---\ntitle: ${JSON.stringify(title)}\ndescription: '用一句话说明这篇讲义要回答的问题。'\ndate: '${date}'\ndraft: true\ntopic: 待分类\n---\n\n## 从一个问题开始\n\n在这里写正式正文。\n`);
await mkdir(resolve(root, 'docs/briefs'), { recursive: true });
await writeFile(resolve(root, 'docs/briefs', `${slug}.md`), `# ${title}：制作说明\n\n## 核心问题与学习目标\n\n## 前置知识与范围\n\n## 解释主线\n\n## 交互要求\n\n每项说明初始状态、允许的操作、观察目标和数学依据。\n\n## 必须保留的条件与措辞\n\n## 未决问题与验收\n`);
console.log(`已创建 ${slug} 的正文和制作说明。运行 npm run dev 查看草稿。`);
