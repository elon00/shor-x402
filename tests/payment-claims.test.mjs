import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalClaim, claimHash, matchClaim } from '../src/security/payment-claims.mjs';
const now = Date.now();
const base = {
 network:'algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=',
 assetId:31566704, recipient:'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM',
 amountMicro:5000, resource:'/api/v1/shor/execute', nonce:'a'.repeat(64), expiresAt:now+300000
};
test('canonical expected claim hashes deterministically',()=>assert.equal(claimHash(base),claimHash({...base})));
test('correct claim matches',()=>assert.equal(matchClaim(base,base,now),true));
for (const [name,change] of [
 ['network',{network:'algorand:testnet'}], ['asset',{assetId:10458941}],
 ['recipient',{recipient:'A'.repeat(58)}], ['amount',{amountMicro:1}],
 ['resource',{resource:'/api/another'}], ['nonce',{nonce:'b'.repeat(64)}],
 ['expiry',{expiresAt:now+200000}]
]) test('rejects altered '+name,()=>assert.equal(matchClaim(base,{...base,...change},now),false));
test('rejects expired claim',()=>assert.equal(matchClaim(base,base,now+300001),false));
test('rejects malformed nonce',()=>assert.throws(()=>canonicalClaim({...base,nonce:'bad'})));
test('rejects amount as floating point',()=>assert.throws(()=>canonicalClaim({...base,amountMicro:0.005})));
