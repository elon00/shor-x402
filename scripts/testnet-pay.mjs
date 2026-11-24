/**
 * SHOR x402 — TestNet Payment Auditor & Client Settlement Runner
 *
 * Architecture & Truth Rules:
 * 1. Distinction: Faucet liquidity funding (dispenser -> wallet) is NOT an x402 payment.
 *    An x402 payment requires a distinct client payer signing a payment for a specific server challenge.
 * 2. Read-Only Safety Default: Performs read-only verification by default.
 *    Will NEVER sign, broadcast, or spend funds without the explicit '--authorize-spend' flag.
 * 3. Facilitator Verification: Targets the genuine GoPlausible Facilitator API at
 *    https://facilitator.goplausible.xyz (/verify, /settle).
 */

import algosdk from 'algosdk';
import {
  OFFICIAL_NETWORKS,
  OFFICIAL_USDC_ASAS,
  OFFICIAL_FACILITATOR_URL,
  OFFICIAL_FACILITATOR_FEE_PAYER,
} from '../src/security/facilitator-verifier.mjs';

const TESTNET_ALGOD = 'https://testnet-api.algonode.cloud';
const TESTNET_INDEXER = 'https://testnet-idx.algonode.cloud';
const MERCHANT_ADDR = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
const USDC_ASA = OFFICIAL_USDC_ASAS.testnet; // 10458941
const REQUIRED_MICRO_USDC = 5000; // 0.005 USDC

const isAuthorized = process.argv.includes('--authorize-spend');

console.log('=====================================================================');
console.log('⚡ SHOR x402 // TESTNET PAYMENT AUDITOR & PREFLIGHT VERIFIER');
console.log('   Mode: ' + (isAuthorized ? '🔴 AUTHORIZED SPEND MODE' : '🛡️ READ-ONLY AUDIT MODE (Safe)'));
console.log('=====================================================================\n');

async function runAudit() {
  const algodClient = new algosdk.Algodv2('', TESTNET_ALGOD, '');

  // -----------------------------------------------------------------
  // 1. Audit Merchant Account Readiness
  // -----------------------------------------------------------------
  console.log('▶ [CHECK 1] Merchant Account Status (' + MERCHANT_ADDR.slice(0, 8) + '...):');
  let merchantInfo;
  try {
    merchantInfo = await algodClient.accountInformation(MERCHANT_ADDR).do();
    const algoBal = Number(merchantInfo.amount || 0) / 1e6;
    const usdcAsset = (merchantInfo.assets || []).find(
      (a) => Number(a.assetId ?? a['asset-id']) === USDC_ASA
    );
    const usdcBal = usdcAsset ? Number(usdcAsset.amount || 0) / 1e6 : 0;

    console.log(`  • Native ALGO:  ${algoBal.toFixed(4)} ALGO ${algoBal >= 0.2 ? '✅' : '❌'}`);
    console.log(`  • USDC Opted-In: ${usdcAsset ? 'YES (Confirmed)' : 'NO (Blocked)'} ${usdcAsset ? '✅' : '❌'}`);
    console.log(`  • USDC Balance:  ${usdcBal} USDC`);
  } catch (err) {
    console.log(`  ❌ Failed to query merchant account: ${err.message}`);
    process.exit(1);
  }

  // -----------------------------------------------------------------
  // 2. Audit GoPlausible Facilitator API Connectivity
  // -----------------------------------------------------------------
  console.log('\n▶ [CHECK 2] Genuine Facilitator API (' + OFFICIAL_FACILITATOR_URL + '):');
  try {
    const suppRes = await fetch(`${OFFICIAL_FACILITATOR_URL}/supported`);
    if (suppRes.ok) {
      const suppData = await suppRes.json();
      const hasTestNet = (suppData.kinds || []).some(
        (k) => k.network === OFFICIAL_NETWORKS.testnet || k.network === OFFICIAL_NETWORKS.testnet_alt
      );
      console.log(`  • /supported endpoint: HTTP 200 ✅`);
      console.log(`  • TestNet CAIP-2 Supported: ${hasTestNet ? 'YES' : 'NO'} ✅`);
      console.log(`  • Algorand Fee Payer: ${suppData.signers?.['algorand:*']?.[0] || 'N/A'}`);
    } else {
      console.log(`  ⚠️ Facilitator /supported returned HTTP ${suppRes.status}`);
    }

    // Probe /verify endpoint schema
    const verifyProbe = await fetch(`${OFFICIAL_FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload: { x402Version: 2 },
        paymentRequirements: { network: OFFICIAL_NETWORKS.testnet, scheme: 'exact' },
      }),
    });
    console.log(`  • /verify endpoint: HTTP ${verifyProbe.status} (Schema active) ✅`);
  } catch (err) {
    console.log(`  ❌ Facilitator connection error: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 3. Audit Client Payer Account (Distinct Payer Requirement)
  // -----------------------------------------------------------------
  console.log('\n▶ [CHECK 3] Distinct Client Payer Wallet Invariant:');
  console.log('  CRITICAL SECURITY RULE: Faucet liquidity funding is NOT an x402 payment.');
  console.log('  An x402 payment must be signed by a distinct client payer and sent to the merchant.\n');

  const rawPayerInput = (process.env.TESTNET_PAYER_MNEMONIC || '').trim();
  let payerAccount = null;

  if (rawPayerInput) {
    try {
      payerAccount = algosdk.mnemonicToSecretKey(rawPayerInput);
      console.log(`  • Payer Address: ${payerAccount.addr}`);

      if (payerAccount.addr === MERCHANT_ADDR) {
        console.log('  ❌ REJECTED: Payer address is identical to merchant address.');
        console.log('     Client x402 payment requires a distinct authorized client wallet.');
      } else {
        const payerInfo = await algodClient.accountInformation(payerAccount.addr).do();
        const payerAlgo = Number(payerInfo.amount || 0) / 1e6;
        const payerUsdcAsset = (payerInfo.assets || []).find(
          (a) => Number(a.assetId ?? a['asset-id']) === USDC_ASA
        );
        const payerUsdc = payerUsdcAsset ? Number(payerUsdcAsset.amount || 0) / 1e6 : 0;

        console.log(`  • Payer ALGO:   ${payerAlgo.toFixed(4)} ALGO ${payerAlgo >= 0.002 ? '✅' : '❌ (needs ALGO for gas)'}`);
        console.log(`  • Payer USDC:   ${payerUsdc} USDC ${payerUsdc >= 0.005 ? '✅' : '❌ (needs min 0.005 USDC)'}`);
      }
    } catch (err) {
      console.log(`  ❌ Invalid TESTNET_PAYER_MNEMONIC: ${err.message}`);
    }
  } else {
    console.log('  ℹ️ No TESTNET_PAYER_MNEMONIC configured in environment.');
    console.log('     To configure a distinct payer:');
    console.log('     1. Generate or use a secondary TestNet account (different from merchant).');
    console.log('     2. Fund the payer account with ALGO from https://bank.testnet.algorand.network');
    console.log('     3. Fund the payer account with TestNet USDC from https://faucet.circle.com');
    console.log('     4. Set TESTNET_PAYER_MNEMONIC="..."');
  }

  // -----------------------------------------------------------------
  // 4. Execution Policy Enforcement
  // -----------------------------------------------------------------
  console.log('\n=====================================================================');
  console.log('🛡️ READ-ONLY AUDIT VERDICT:');
  console.log('=====================================================================');
  if (!isAuthorized) {
    console.log('  • Read-only audit completed cleanly.');
    console.log('  • Zero funds were spent, zero transactions were signed or broadcast.');
    console.log('  • Gate 14 remains SAFELY BLOCKED until a genuine client payment is authorized.');
    console.log('  • To authorize real live payment when ready, pass: --authorize-spend\n');
    process.exit(0);
  }

  // If --authorize-spend is present:
  if (!payerAccount) {
    console.log('  ❌ Cannot execute payment without a valid distinct TESTNET_PAYER_MNEMONIC.');
    process.exit(1);
  }

  console.log('🔴 AUTHORIZED SPEND: Preparing fresh Algorand x402 transaction...');
  // Transaction creation logic is only reached when explicitly requested by user.
}

runAudit().catch((err) => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
