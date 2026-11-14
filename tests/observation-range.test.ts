import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, clampCenter, clampWidth, inspect, value } from '../src/lib/examples.ts';
import type { Kind } from '../src/lib/examples.ts';
test('all permitted centers and widths keep the frame in the fixed view',()=>{
 for(const k of Object.keys(examples) as Kind[]){const s=examples[k];
  for(let i=0;i<=100;i++){const a=s.centers[0]+(s.centers[1]-s.centers[0])*i/100;
   assert.ok(a-s.widths[1]>=s.view[0]-1e-10,k);assert.ok(a+s.widths[1]<=s.view[1]+1e-10,k);
   assert.ok(value(k,a)-s.eps>=s.view[2]-1e-10,k);assert.ok(value(k,a)+s.eps<=s.view[3]+1e-10,k);
  }
  assert.equal(clampCenter(k,-100),s.centers[0]);assert.equal(clampCenter(k,100),s.centers[1]);
  assert.equal(clampWidth(k,0),s.widths[0]);assert.equal(clampWidth(k,100),s.widths[1]);
  assert.equal(clampCenter(k,NaN),s.center);
 }
});
test('square experiment fits initial, failure, narrowing, and later failure in one view',()=>{
 assert.equal(inspect('square',.8,.2,.5).safe,true);
 assert.equal(inspect('square',1.6,.2,.5).safe,false);
 assert.equal(inspect('square',1.6,.1,.5).safe,true);
 assert.equal(inspect('square',3,.1,.5).safe,false);
});
