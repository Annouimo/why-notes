export type FunctionKind = 'sine' | 'square';
export interface Candidate { offset: number; difference: number; interior: boolean }
export interface BoxAnalysis {
  safe: boolean;
  maximum: number;
  witness: Candidate | null;
}
export const scenes = {
  sine: { title: '一只到处合适的框', formula: 'y = sin x', epsilon: 0.5, delta: 0.4, center: 0 },
  square: { title: '眼前修好了，远处呢？', formula: 'y = x²', epsilon: 0.5, delta: 0.1, center: 1 },
} as const;

export function difference(kind: FunctionKind, center: number, offset: number): number {
  // Avoid subtracting nearly equal squares, or sines at a large center.
  return kind === 'square'
    ? 2 * center * offset + offset * offset
    : 2 * Math.cos(center + offset / 2) * Math.sin(offset / 2);
}

export function analyzeBox(kind: FunctionKind, center: number, delta: number, epsilon: number): BoxAnalysis {
  if (![center, delta, epsilon].every(Number.isFinite) || delta <= 0 || epsilon <= 0)
    throw new RangeError('Center must be finite; delta and epsilon must be positive and finite.');
  if (kind === 'sine' && delta > Math.PI) throw new RangeError('Sine analysis supports delta ≤ π.');
  const candidates: Candidate[] = [-delta, delta].map(offset => ({
    offset, difference: difference(kind, center, offset), interior: false,
  }));
  if (kind === 'square' && -center > -delta && -center < delta) {
    candidates.push({ offset: -center, difference: difference(kind, center, -center), interior: true });
  }
  if (kind === 'sine') {
    const first = Math.ceil((center - delta - Math.PI / 2) / Math.PI);
    const last = Math.floor((center + delta - Math.PI / 2) / Math.PI);
    for (let k = first; k <= last; k++) {
      const offset = Math.PI / 2 + k * Math.PI - center;
      if (Math.abs(offset) < delta)
        candidates.push({ offset, difference: difference(kind, center, offset), interior: true });
    }
  }
  const maximum = Math.max(...candidates.map(p => Math.abs(p.difference)));
  const bad = candidates.find(p => p.interior
    ? Math.abs(p.difference) >= epsilon
    : Math.abs(p.difference) > epsilon);
  if (!bad) return { safe: true, maximum, witness: null };
  if (bad.interior) return { safe: false, maximum, witness: bad };
  // The endpoint is outside the open horizontal interval. Find an actual interior witness.
  const target = epsilon + Math.min(epsilon * .2, (Math.abs(bad.difference) - epsilon) / 2);
  let low = 0, high = 1;
  for (let i = 0; i < 60; i++) {
    const middle = (low + high) / 2;
    if (Math.abs(difference(kind, center, bad.offset * middle)) >= target) high = middle;
    else low = middle;
  }
  const offset = bad.offset * high;
  return { safe: false, maximum, witness: { offset, difference: difference(kind, center, offset), interior: true } };
}
