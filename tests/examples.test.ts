import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspect,value} from '../src/lib/examples.ts';
test('root box handles the domain endpoint and translated boxes',()=>{for(const a of[0,.1,.25,1,10])assert.equal(inspect('root',a,.25,.5).safe,true);});
test('inverse and oscillations expose interior witnesses',()=>{for(const[k,a,d]of [['inverse',.1,.01],['oscillation',.02,.01],['chirp',20,.1]] as const){const r=inspect(k,a,d,.5);assert.equal(r.safe,false);assert.ok(Math.abs(r.witness!-a)<d);assert.ok(Math.abs(value(k,r.witness!)-value(k,a))>=.5);}});
test('damped wave certifies small widths, never certifies arbitrary sampled intervals',()=>{assert.equal(inspect('damped',0,.01,.5).safe,true);assert.notEqual(inspect('damped',.6,.8,.5).safe,true);});
