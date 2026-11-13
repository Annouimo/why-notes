import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rendererRequire = createRequire(require.resolve('rehype-katex'));

test('the math renderer and the imported KaTeX stylesheet use the same version', () => {
  const stylesheetPackage = require('katex/package.json');
  const rendererPackage = rendererRequire('katex/package.json');
  assert.equal(stylesheetPackage.version, rendererPackage.version,
    'KaTeX generated HTML and CSS must match; a different stylesheet version can flatten subscripts.');
});
