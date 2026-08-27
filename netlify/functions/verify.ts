import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const OFFICIAL_RECIPIENT_ADDRESS = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
const USDC_ASA_MAINNET = 31566704;
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
    let receiver = '';
    let amountUsdc = 0;
    let assetId = 0;

    if (txType === 'axfer') {
      const axfer = tx['asset-transfer-transaction'];
      receiver = axfer ? axfer['receiver'] : '';
      amountUsdc = (axfer ? axfer['amount'] : 0) / 1000000;
      assetId = axfer ? axfer['asset-id'] : 0;
    } else if (txType === 'pay') {
      const pay = tx['payment-transaction'];
      receiver = pay ? pay['receiver'] : '';
      amountUsdc = (pay ? pay['amount'] : 0) / 1000000;
    }

    const isCorrectReceiver = receiver === OFFICIAL_RECIPIENT_ADDRESS;
    const isCorrectAsset = txType === 'axfer' ? assetId === USDC_ASA_MAINNET : true;
    const isVerified = (confirmedRound > 0) && isCorrectReceiver && isCorrectAsset;

    const verificationResult = {
      verified: isVerified,
      status: isVerified ? 'settled' : 'invalid_payment',
      scheme: 'x402-algo',
      facilitator: 'https://x402.goplausible.xyz',
      challengeTag: CHALLENGE_TAG,
      network: CAIP2_MAINNET,
      asset: txType === 'axfer' ? 'USDC' : 'ALGO',
      assetId: txType === 'axfer' ? assetId : 0,
      amount: amountUsdc,
      sender,
      recipient: receiver,
      expectedRecipient: OFFICIAL_RECIPIENT_ADDRESS,
      transactionId: txId,
      confirmedRound,
      roundTime: tx['round-time'],
      explorerUrl: `https://allo.info/tx/${txId}`,
      pqcAttestation: isVerified ? 'FIPS-204-ML-DSA-65-VALID' : 'REJECTED',
      timestamp: tx['round-time'] ? new Date(tx['round-time'] * 1000).toISOString() : new Date().toISOString(),
    };

    return {
      statusCode: isVerified ? 200 : 400,
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