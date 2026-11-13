import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeBox, difference } from '../src/lib/continuity.ts';

test('the sine box works at many centers and across local extrema', () => {
  for (let i = -1000; i <= 1000; i++) assert.equal(analyzeBox('sine', i / 13, .4, .5).safe, true);
});
test('sine interior tangency to a red boundary fails', () => {
  const result = analyzeBox('sine', 0, 2, 1);
  assert.equal(result.safe, false);
  assert.equal(result.witness?.interior, true);
  assert.equal(result.maximum, 1);
});
test('a corner is permitted, but crossing inside the horizontal interval fails', () => {
  assert.equal(analyzeBox('square', 0, .5, .25).safe, true);
  const result = analyzeBox('square', 0, .51, .25);
  assert.equal(result.safe, false);
  assert.ok(Math.abs(result.witness!.offset) < .51);
  assert.ok(Math.abs(result.witness!.difference) >= .25);
});
test('square starts safe, then fails; narrowing repairs the local box and farther right fails again', () => {
  assert.equal(analyzeBox('square', 1, .1, .5).safe, true);
  assert.equal(analyzeBox('square', 3, .1, .5).safe, false);
  assert.equal(analyzeBox('square', 3, .05, .5).safe, true);
  assert.equal(analyzeBox('square', 6, .05, .5).safe, false);
});
test('a positive width always has a square counterexample, including negative centers', () => {
  for (const delta of [.8, .1, .001, .000001]) {
    for (const sign of [-1, 1]) {
      const center = sign * (1 / delta + 1);
      const result = analyzeBox('square', center, delta, .5);
      assert.equal(result.safe, false);
      assert.ok(Math.abs(result.witness!.offset) < delta);
      assert.ok(Math.abs(result.witness!.difference) >= .5);
    }
  }
});
test('square cancellation is avoided at large centers', () => {
  assert.equal(difference('square', 1e9, 1e-6), 2000 + 1e-12);
});
test('invalid inputs are rejected', () => {
  for (const args of [[NaN,.1,.5],[0,0,.5],[0,.1,Infinity]] as const)
    assert.throws(() => analyzeBox('square', args[0], args[1], args[2]), RangeError);
});
