import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig(({ isPreview }) => ({
  accountId: '35df1f63445d298638533fec3a13a62c',
  worker: {
    name: 'why-notes',
    compatibilityDate: '2026-11-14',
    compatibilityFlags: ['global_fetch_strictly_public'],
    entrypoint,
    env: { ASSETS: bindings.assets() },
    assets: { htmlHandling: 'force-trailing-slash', notFoundHandling: '404-page' },
    workersDev: false,
    previewUrls: false,
    ...(!isPreview ? { domains: [{ hostname: 'learn.annouimo.com', production: true, previews: true }] } : {}),
    observability: { enabled: true, logs: { enabled: true }, traces: { enabled: true } },
  },
}));
