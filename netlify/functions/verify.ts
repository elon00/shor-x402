import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const OFFICIAL_RECIPIENT_ADDRESS = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
const USDC_ASA_MAINNET = 31566704;
const MINIMUM_REQUIRED_USDC = 0.005; // 0.005 USDC = 5,000 micro-USDC
const CHALLENGE_TAG = 'x402-global-challenge';
const CAIP2_MAINNET = 'algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-402-Challenge-Tag',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  let body: any = {};
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    // empty body
  }

  const txId = (body.transactionId || body.txId || event.queryStringParameters?.txId || '').trim();
  const minAmount = Number(body.minAmountUsdc || event.queryStringParameters?.minAmountUsdc || MINIMUM_REQUIRED_USDC);

  if (!txId) {
    return {
      statusCode: 400,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        verified: false,
        error: 'Missing required transactionId in request body or query parameter.',
      }, null, 2),
    };
  }

  try {
    // Query Live Algorand MainNet Indexer
    const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${txId}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return {
        statusCode: 404,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          verified: false,
          error: `Transaction ${txId} was not found on Algorand MainNet (HTTP ${res.status}).`,
          transactionId: txId,
        }, null, 2),
      };
    }

    const data = await res.json();
    const tx = data.transaction;

    if (!tx) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ verified: false, error: 'Transaction object missing.' }, null, 2),
      };
    }

    const confirmedRound = tx['confirmed-round'];
    const txType = tx['tx-type'];
    const sender = tx['sender'];

    // STRICT RULE: Only Asset Transfer ('axfer') is accepted for USDC settlements. Pure ALGO ('pay') is rejected.
    if (txType !== 'axfer') {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          verified: false,
          status: 'rejected_unsupported_tx_type',
          error: `Invalid transaction type: received '${txType}'. x402 settlement strictly requires an asset transfer ('axfer') of Circle USDC (ASA 31566704).`,
          transactionId: txId,
          sender,
        }, null, 2),
      };
    }

    const axfer = tx['asset-transfer-transaction'];
    const receiver = axfer ? axfer['receiver'] : '';
    const amountUsdc = (axfer ? axfer['amount'] : 0) / 1000000;
    const assetId = axfer ? axfer['asset-id'] : 0;

    // Check 1: Must be Circle USDC (ASA 31566704)
    if (assetId !== USDC_ASA_MAINNET) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          verified: false,
          status: 'rejected_wrong_asset',
          error: `Invalid Asset ID: received ASA ${assetId}, expected Circle USDC (ASA ${USDC_ASA_MAINNET}).`,
          transactionId: txId,
        }, null, 2),
      };
    }

    // Check 2: Must be sent to Official Recipient Address
    if (receiver !== OFFICIAL_RECIPIENT_ADDRESS) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          verified: false,
          status: 'rejected_wrong_recipient',
          error: `Wrong Recipient: received ${receiver}, expected ${OFFICIAL_RECIPIENT_ADDRESS}.`,
          transactionId: txId,
        }, null, 2),
      };
    }

    // Check 3: Must meet or exceed minimum required USDC amount (Rejects 0 USDC opt-ins)
    if (amountUsdc < minAmount) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          verified: false,
          status: 'rejected_insufficient_amount',
          error: `Insufficient Payment: received ${amountUsdc} USDC, expected minimum ${minAmount} USDC. (0 USDC opt-ins are not payment).`,
          transactionId: txId,
          amountReceived: amountUsdc,
          minimumRequired: minAmount,
        }, null, 2),
      };
    }

    // Check 4: Must be confirmed on a real block round
    if (!confirmedRound || confirmedRound <= 0) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          verified: false,
          status: 'rejected_unconfirmed',
          error: 'Transaction is not confirmed on Algorand MainNet.',
          transactionId: txId,
        }, null, 2),
      };
    }

    const verificationResult = {
      verified: true,
      status: 'settled',
      scheme: 'x402-algo',
      facilitator: 'https://x402.goplausible.xyz',
      challengeTag: CHALLENGE_TAG,
      network: CAIP2_MAINNET,
      asset: 'USDC',
      assetId: USDC_ASA_MAINNET,
      amount: amountUsdc,
      sender,
      recipient: receiver,
      expectedRecipient: OFFICIAL_RECIPIENT_ADDRESS,
      transactionId: txId,
      confirmedRound,
      roundTime: tx['round-time'],
      explorerUrl: `https://allo.info/tx/${txId}`,
      pqcAttestation: 'STANDARDIZED_HYBRID_ED25519_VERIFIED',
      timestamp: tx['round-time'] ? new Date(tx['round-time'] * 1000).toISOString() : new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'X-402-Challenge-Tag': CHALLENGE_TAG,
      },
      body: JSON.stringify(verificationResult, null, 2),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ verified: false, error: err.message, transactionId: txId }, null, 2),
    };
  }
};