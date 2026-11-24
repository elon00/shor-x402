// Executes ONLY when SHOR_TEST_DATABASE_URL is set. No simulated PASS for real DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {claimHash} from '../src/security/payment-claims.mjs';
import {claimSettledPayment} from '../src/security/durable-settlement.mjs';
const url=process.env.SHOR_TEST_DATABASE_URL;
test('real PostgreSQL concurrent replay rejects every duplicate', {skip:!url&&'SHOR_TEST_DATABASE_URL missing'},async()=>{
 const require=createRequire(import.meta.url);
 const {Pool}=require('pg');
 const pool=new Pool({connectionString:url, max:10});
 const claim={network:'algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=',assetId:31566704,recipient:'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM',amountMicro:5000,resource:'/api/v1/shor/execute',nonce:randomBytes(32).toString('hex'),expiresAt:Date.now()+120000};
 const txId=Array.from(randomBytes(32), x=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[x%32]).join('').padEnd(52,'A');
 const proof={verified:true,settled:true,txId,network:claim.network,challengeHash:claimHash(claim)};
 try { const results=await Promise.all(Array.from({length:10},()=>claimSettledPayment(pool,{expected:claim,supplied:claim,txId,settlementProof:proof,verifySettlement:async()=>true})));
 assert.equal(results.filter(x=>x.claimed).length,1);
 }finally{await pool.query('DELETE FROM shor_payment_claims WHERE network=$1 AND tx_id=$2',[claim.network,txId]);await pool.end()}
});
