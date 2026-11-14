import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://learn.annouimo.com',
  output: 'static',
  session: false,
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: { processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }) },
  adapter: cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'node' }),
});