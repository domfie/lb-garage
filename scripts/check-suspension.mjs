import assert from 'node:assert/strict';
import { suspensionAt, DROP_HEIGHT, IMPACT_TIME } from '../src/suspension.js';
assert.equal(suspensionAt(0).drop,DROP_HEIGHT);
assert.equal(suspensionAt(IMPACT_TIME).drop,0);
let compressed=false,rebounded=false;
for(let t=0;t<3;t+=1/120){const frame=suspensionAt(t);assert(frame.drop>=0,'Tyres must never go through platform');assert(Math.abs(frame.compression)<.07,'Chassis travel must stay plausible');if(frame.compression<-.03)compressed=true;if(frame.compression>.005)rebounded=true;}
assert(compressed&&rebounded,'Chassis must compress and rebound');
assert.deepEqual(suspensionAt(3),{drop:0,compression:0,impact:0});
assert.deepEqual(suspensionAt(0,true),{drop:0,compression:0,impact:0});
console.log('PASS drop, ground contact, compression, rebound, settling, reduced motion');
