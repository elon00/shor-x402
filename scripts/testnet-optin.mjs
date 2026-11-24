/**
 * SHOR x402 — 1-Click TestNet USDC Opt-In Script
 * Submits a standard zero-amount self-transfer to opt the staging account into
 * Circle TestNet USDC (ASA 10458941).
 *
 * Security:
 * - Runs 100% locally on your machine.
 * - Does not log, save, or transmit your passphrase to any external server.
 * - Clears credentials from memory immediately after transaction broadcast.
 */

import algosdk from 'algosdk';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';

const TESTNET_ALGOD = 'https://testnet-api.algonode.cloud';
const TESTNET_USDC_ASA = 10458941;

console.log('=====================================================================');
console.log('⚡ SHOR x402 // 1-CLICK TESTNET USDC OPT-IN');
console.log('=====================================================================\n');

async function run() {
  const algodClient = new algosdk.Algodv2('', TESTNET_ALGOD, '');

  let rawInput = (process.env.TESTNET_MNEMONIC || '').trim();

  if (!rawInput) {
    const rl = readline.createInterface({ input, output });
    console.log('Please paste your 25-word TestNet mnemonic below (numbering will be cleaned automatically):');
    rawInput = await rl.question('> ');
    rl.close();
    rawInput = rawInput.trim();
  }

  // 1. Clean numbering (e.g. "1. puppy 2. traffic ...") and normalize spaces
  let cleaned = rawInput.replace(/\b\d+[\.\:\)]\s*/g, ' ').replace(/\s+/g, ' ').trim();

  // 2. Autocorrect known common OCR/typing slip (e.g. 'diff' -> 'cliff')
  cleaned = cleaned.replace(/\bdiff\b/gi, 'cliff');

  const words = cleaned.split(/\s+/);
  if (words.length < 24) {
    console.error(`\n❌ Error: Valid 25-word Algorand mnemonic is required. Found ${words.length} words.`);
    process.exit(1);
  }

  let account;
  try {
    account = algosdk.mnemonicToSecretKey(cleaned);
  } catch (err) {
    console.error('\n❌ Error: Failed to parse mnemonic:', err.message);
    process.exit(1);
  } finally {
    // Zero out sensitive variables from memory
    rawInput = '';
    cleaned = '';
  }

  const accountAddr = account.addr.toString();
  console.log(`\n🔑 Signing Account: ${accountAddr}`);

  // 3. Check account balance on Algorand TestNet
  const accountInfo = await algodClient.accountInformation(accountAddr).do();
  const balanceAlgo = Number(accountInfo.amount || 0) / 1e6;
  console.log(`💰 Account Balance: ${balanceAlgo} ALGO`);

  if (balanceAlgo < 0.002) {
    console.error('❌ Error: Account has insufficient ALGO for the 0.001 ALGO opt-in transaction fee.');
    process.exit(1);
  }

  const assets = accountInfo.assets || [];
  const alreadyOptedIn = assets.some((a) => a['asset-id'] === TESTNET_USDC_ASA);

  if (alreadyOptedIn) {
    console.log('✅ Account is ALREADY opted in to USDC ASA 10458941!');
    console.log('\nRunning preflight verification now...\n');
    execSync('npm run testnet:preflight', {
      stdio: 'inherit',
      env: { ...process.env, TESTNET_MERCHANT_ADDRESS: accountAddr }
    });
    return;
  }

  // 4. Fetch suggested network parameters
  console.log('📡 Fetching suggested network parameters from Algorand TestNet...');
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 5. Construct 0-amount asset transfer to self (Algorand Opt-In convention)
  console.log(`📝 Building Opt-In transaction for ASA ${TESTNET_USDC_ASA}...`);
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: accountAddr,
    receiver: accountAddr,
    assetIndex: TESTNET_USDC_ASA,
    amount: 0,
    suggestedParams,
  });

  // 6. Sign transaction locally
  console.log('✍️ Signing transaction locally with secret key...');
  const txId = optInTxn.txID();
  const signedTxn = optInTxn.signTxn(account.sk);

  // 7. Broadcast to TestNet node
  console.log(`🚀 Broadcasting transaction ${txId} to Algorand TestNet node...`);
  await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`📨 Submitted Transaction ID: ${txId}`);
  console.log(`🔍 Explorer Link: https://testnet.allo.info/tx/${txId}`);

  // 8. Wait for consensus confirmation
  console.log('⏳ Waiting for consensus confirmation on TestNet (~3.5 seconds)...');
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 10);
  const confirmedRound = confirmedTxn['confirmed-round'] || confirmedTxn.confirmedRound;
  console.log(`🎉 CONFIRMED in round: ${confirmedRound}!\n`);

  console.log('=====================================================================');
  console.log('🏆 TESTNET USDC OPT-IN COMPLETE! RUNNING PREFLIGHT:');
  console.log('=====================================================================\n');

  execSync('npm run testnet:preflight', {
    stdio: 'inherit',
    env: { ...process.env, TESTNET_MERCHANT_ADDRESS: accountAddr }
  });
}

run().catch((err) => {
  console.error('\n❌ Fatal opt-in error:', err.message);
  process.exit(1);
});
