import test from 'node:test';
import assert from 'node:assert/strict';
import {conwayStep,runConway,solveQubo} from '../src/engines/paid-computation.mjs';
test('Conway blinker flips and repeats',()=>{
 const a=[[0,0,0],[1,1,1],[0,0,0]],b=[[0,1,0],[0,1,0],[0,1,0]];
 assert.deepEqual(conwayStep(a),b);assert.deepEqual(runConway(a,2),a);
});
test('Conway stable block',()=>{let a=[[1,1],[1,1]];assert.deepEqual(runConway(a,3),a)});
test('Conway zero steps returns copy',()=>{let a=[[1]];let b=runConway(a,0);assert.deepEqual(a,b);assert.notStrictEqual(a,b)});
test('Conway rejects invalid grids',()=>{for(const g of [[],[[2]],[[0],[1,0]],null])assert.throws(()=>conwayStep(g))});
test('Conway step limit',()=>assert.throws(()=>runConway([[0]],1001)));
test('QUBO 1-bit positive cost',()=>assert.deepEqual(solveQubo([[5]]).bits,[0]));
test('QUBO 1-bit negative cost',()=>{const r=solveQubo([[-3]]);assert.deepEqual(r.bits,[1]);assert.equal(r.energy,-3)});
test('QUBO exact two variable minimum',()=>{const r=solveQubo([[-1,2],[2,-1]]);assert.equal(r.energy,-1);assert.equal(r.candidates,4)});
test('QUBO rejects malformed / overflow inputs',()=>{for(const q of [[],[[NaN]],[[Infinity]],[[1,2]],Array.from({length:21},()=>Array(21).fill(0))])assert.throws(()=>solveQubo(q))});
test('QUBO deterministic repeated result',()=>assert.deepEqual(solveQubo([[-1,0],[0,-2]]),solveQubo([[-1,0],[0,-2]])));
