import { analyzeBox, difference, scenes } from './continuity';
import type { FunctionKind } from './continuity';

const NS = 'http://www.w3.org/2000/svg';
function svgElement(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
function format(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) return value.toExponential(2);
  return Number(value.toPrecision(5)).toString();
}

class ContinuityBox extends HTMLElement {
  kind: FunctionKind = 'sine';
  center = 0;
  delta = .4;
  epsilon = .5;
  observer?: ResizeObserver;
  controller?: AbortController;
  drag?: { x: number; center: number; scale: number };
  frame?: number;
  ready = false;
  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    this.kind = this.dataset.kind === 'square' ? 'square' : 'sine';
    this.reset();
    const controller = new AbortController(); this.controller = controller;
    const options = { signal: controller.signal };
    this.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button => button.addEventListener('click', () => {
      const step = this.kind === 'sine' ? .5 : Math.max(.25, Math.abs(this.center) * .12, .04 / this.delta);
      this.setCenter(this.center + Number(button.dataset.move) * step);
    }, options));
    this.querySelectorAll<HTMLButtonElement>('[data-width]').forEach(button => button.addEventListener('click', () => {
      this.delta = Math.min(.8, Math.max(.000001, this.delta * Number(button.dataset.width)));
      this.querySelector<HTMLElement>('[data-hint]')!.textContent = '半高保持不变；视野随新宽度调整，留意横轴刻度。';
      this.draw();
    }, options));
    this.querySelector('[data-reset]')!.addEventListener('click', () => { this.reset(); this.draw(); }, options);
    const input = this.querySelector<HTMLInputElement>('[data-center]')!;
    input.addEventListener('input', () => {
      if (Number.isFinite(input.valueAsNumber)) { input.setCustomValidity(''); this.setCenter(input.valueAsNumber); }
    }, options);
    input.addEventListener('change', () => {
      if (!Number.isFinite(input.valueAsNumber)) {
        input.setCustomValidity('请输入一个有限的数值。'); input.reportValidity(); return;
      }
      input.setCustomValidity(''); this.setCenter(input.valueAsNumber);
    }, options);
    const svg = this.querySelector<SVGSVGElement>('.main-plot')!;
    svg.addEventListener('pointerdown', event => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-drag]')) return;
      this.drag = { x: event.clientX, center: this.center, scale: this.delta * 4 / Math.max(1, svg.clientWidth - 96) };
      svg.setPointerCapture(event.pointerId);
    }, options);
    svg.addEventListener('pointermove', event => {
      if (!this.drag) return;
      this.setCenter(this.drag.center + (event.clientX - this.drag.x) * this.drag.scale);
    }, options);
    const stop = () => { this.drag = undefined; };
    svg.addEventListener('pointerup', stop, options);
    svg.addEventListener('pointercancel', stop, options);
    svg.addEventListener('lostpointercapture', stop, options);
    this.querySelector('.overview')?.addEventListener('toggle', () => this.drawOverview(), options);
    this.observer = new ResizeObserver(() => {
      cancelAnimationFrame(this.frame ?? 0);
      this.frame = requestAnimationFrame(() => this.draw());
    });
    this.observer.observe(this.querySelector('.plot-host')!);
    this.draw();
  }
  disconnectedCallback() {
    this.controller?.abort(); this.observer?.disconnect(); cancelAnimationFrame(this.frame ?? 0); this.ready = false;
  }
  reset() {
    const config = scenes[this.kind]; this.center = config.center; this.delta = config.delta; this.epsilon = config.epsilon;
    const hint = this.querySelector<HTMLElement>('[data-hint]');
    if (hint) hint.textContent = '横向拖动中心点，或使用左右按钮。';
  }
  setCenter(value: number) {
    this.center = Math.min(1e9, Math.max(-1e9, value));
    this.draw();
  }
  draw() {
    const svg = this.querySelector<SVGSVGElement>('.main-plot')!;
    const w = this.querySelector('.plot-host')!.getBoundingClientRect().width;
    if (w < 1) return;
    const h = w < 500 ? 310 : 350, L = 66, R = w - 30, T = 24, B = h - 55;
    const X = (offset: number) => (L + R) / 2 + offset / (4 * this.delta) * (R - L);
    const Y = (diff: number) => (T + B) / 2 - diff / (3.4 * this.epsilon) * (B - T);
    const a = this.center, d = this.delta, e = this.epsilon;
    const analysis = analyzeBox(this.kind, a, d, e);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('height', String(h));
    svg.replaceChildren();
    const append = (tag: string, attrs: Record<string, string | number>, text?: string) => {
      const node = svgElement(tag, attrs, text); svg.append(node); return node;
    };
    const id = `clip-${this.kind}`;
    const defs = append('defs', {}), clip = svgElement('clipPath', { id });
    clip.append(svgElement('rect', { x: L, y: T, width: R - L, height: B - T })); defs.append(clip);
    append('title', {}, `${scenes[this.kind].formula}，中心 x₀=${format(a)}，半高 ${e}，半宽 ${format(d)}。${analysis.safe ? '当前框合适' : '当前框内有点达到或超出高度限制'}。`);
    append('rect', { x: L, y: T, width: R - L, height: B - T, class: 'plot-outline', fill: 'none' });
    for (const v of [-e, 0, e]) {
      append('line', { x1: L, x2: R, y1: Y(v), y2: Y(v), class: 'plot-grid' });
      append('text', { x: L - 10, y: Y(v) + 4, 'text-anchor': 'end', class: 'plot-tick' }, v === 0 ? '0' : `${v > 0 ? '+' : '−'}${e}`);
    }
    append('line', { x1: X(0), x2: X(0), y1: T, y2: B, class: 'plot-center-guide' });
    append('rect', { x: X(-d), y: Y(e), width: X(d) - X(-d), height: Y(-e) - Y(e), class: 'box-fill' });
    for (const sign of [-1, 1]) {
      append('line', { x1: X(sign * d), x2: X(sign * d), y1: Y(-e), y2: Y(e), class: 'box-side' });
      append('line', { x1: X(-d), x2: X(d), y1: Y(sign * e), y2: Y(sign * e), class: 'box-limit' });
    }
    let path = '', inside = '';
    for (let i = 0; i <= 400; i++) {
      const offset = -2 * d + 4 * d * i / 400;
      const v = Math.max(-50 * e, Math.min(50 * e, difference(this.kind, a, offset)));
      path += `${i ? 'L' : 'M'}${X(offset).toFixed(3)},${Y(v).toFixed(3)}`;
    }
    for (let i = 0; i <= 160; i++) {
      const offset = -d + 2 * d * i / 160;
      const v = Math.max(-50 * e, Math.min(50 * e, difference(this.kind, a, offset)));
      inside += `${i ? 'L' : 'M'}${X(offset).toFixed(3)},${Y(v).toFixed(3)}`;
    }
    append('path', { d: path, class: 'function-path', 'clip-path': `url(#${id})` });
    append('path', { d: inside, class: 'function-inside', 'clip-path': `url(#${id})` });
    if (analysis.witness) {
      const p = analysis.witness;
      append('circle', { cx: X(p.offset), cy: Y(p.difference), r: 5, class: 'witness-point', 'clip-path': `url(#${id})` });
    }
    append('line', { x1: X(0), x2: X(d), y1: Y(0) + 18, y2: Y(0) + 18, class: 'dimension-line' });
    append('text', { x: X(d / 2), y: Y(0) + 35, 'text-anchor': 'middle', class: 'dimension-text' }, 'δ');
    append('line', { x1: X(0) - 18, x2: X(0) - 18, y1: Y(0), y2: Y(e), class: 'dimension-line' });
    append('text', { x: X(0) - 26, y: Y(e / 2) + 4, 'text-anchor': 'end', class: 'dimension-text' }, 'ε');
    append('circle', { cx: X(0), cy: Y(0), r: 5, class: 'center-point', 'data-drag': '' });
    append('circle', { cx: X(0), cy: Y(0), r: 23, fill: 'transparent', class: 'drag-target', 'data-drag': '' });
    for (const offset of [-d, 0, d]) append('text', { x: X(offset), y: B + 19, 'text-anchor': 'middle', class: 'plot-tick' }, offset === 0 ? '0' : `${offset > 0 ? '+' : '−'}${format(d)}`);
    append('text', { x: L, y: 14, class: 'axis-label' }, '高度差 f(x) − f(x₀)');
    append('text', { x: R, y: h - 4, 'text-anchor': 'end', class: 'axis-label' }, '横向偏移 x − x₀');
    const input = this.querySelector<HTMLInputElement>('[data-center]')!;
    if (document.activeElement !== input) input.value = format(a);
    this.querySelector<HTMLElement>('[data-delta]')!.textContent = format(d);
    this.querySelector<HTMLElement>('[data-view-scale]')!.textContent = `x₀ = ${format(a)}`;
    const status = this.querySelector<HTMLElement>('.explorer-status')!;
    status.dataset.safe = String(analysis.safe);
    status.querySelector('.status-symbol')!.textContent = analysis.safe ? '✓' : '!';
    this.querySelector<HTMLElement>('[data-status]')!.textContent = analysis.safe
      ? '当前位置合适：框内曲线未触及上下限制。'
      : '当前位置失效：左右边界之间有点达到或超出红线。';
    this.querySelector<HTMLElement>('[data-detail]')!.textContent = analysis.safe
      ? '这只说明当前位置合适；还要继续考察其他位置。'
      : `框内反例（近似值）：水平差 ${format(Math.abs(analysis.witness!.offset))}，高度差 ${format(Math.abs(analysis.witness!.difference))}。`;
    this.querySelectorAll<HTMLButtonElement>('[data-width]').forEach(button => {
      button.disabled = Number(button.dataset.width) < 1 ? d <= .000001 : d >= .8;
    });
    this.drawOverview();
  }
  drawOverview() {
    const details = this.querySelector<HTMLDetailsElement>('.overview');
    if (!details?.open) return;
    const svg = details.querySelector<SVGSVGElement>('svg')!;
    const w = svg.getBoundingClientRect().width; if (!w) return;
    const h = 130, L = 24, R = w - 24, T = 12, B = 100;
    const span = Math.max(2, Math.abs(this.center) * 1.4), lo = this.center < 0 ? -span : 0, hi = this.center < 0 ? 0 : span;
    const X = (x: number) => L + (x - lo) / (hi - lo) * (R - L);
    const Y = (x: number) => B - (x / span) ** 2 * (B - T);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.replaceChildren();
    let path = ''; for (let i = 0; i <= 100; i++) { const x = lo + (hi - lo) * i / 100; path += `${i ? 'L' : 'M'}${X(x)},${Y(x)}`; }
    svg.append(svgElement('path', { d: path, class: 'function-path' }), svgElement('circle', { cx: X(this.center), cy: Y(this.center), r: 5, class: 'center-point' }));
    svg.append(svgElement('text', { x: X(0), y: 122, 'text-anchor': this.center < 0 ? 'end' : 'start', class: 'plot-tick' }, '原点'));
    svg.append(svgElement('text', { x: X(this.center), y: Math.min(100, Y(this.center) + 22), 'text-anchor': 'middle', class: 'plot-tick' }, `现在：${format(this.center)}`));
  }
}
if (!customElements.get('continuity-box')) customElements.define('continuity-box', ContinuityBox);
