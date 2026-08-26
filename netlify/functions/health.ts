import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const healthData = {
    status: 'healthy',
    protocol: 'x402',
    network: 'algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=',
    service: 'SHOR x402 Post-Quantum Autonomous Agent Commerce Hub',
    challengeTag: 'x402-global-challenge',
    activeRound: 64447633,
    payToAddress: 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM',
    settlementAsset: 'USDC (ASA 31566704)',
    facilitator: 'https://x402.goplausible.xyz',
    pqcEngine: 'NIST FIPS 204 ML-DSA-65 Active',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'X-402-Challenge-Tag': 'x402-global-challenge',
    },
    body: JSON.stringify(healthData, null, 2),
  };
};
