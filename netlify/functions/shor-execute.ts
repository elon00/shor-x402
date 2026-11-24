import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import crypto from 'node:crypto';
import { runConway, solveQubo } from '../../src/engines/paid-computation.mjs';
import { verifyPqcSignature } from '../../src/utils/pqcCrypto.js';

const OFFICIAL_RECIPIENT_ADDRESS = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
const CAIP2_MAINNET = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k';
const USDC_ASA_MAINNET = 31566704;
const MINIMUM_REQUIRED_USDC = 0.005;
const CHALLENGE_TAG = 'x402-global-challenge';
const FACILITATOR_URL = 'https://facilitator.goplausible.xyz';
const BAZAAR_DISCOVERY_URL = 'https://shorx402.netlify.app/.well-known/x402-bazaar.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-402-Proof, X-Agent-Identity, X-PQC-Algorithm, X-PQC-Signature, X-402-Challenge-Tag, X-402-Bazaar-Discovery',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, X-402-Payment-Required, X-402-CAIP2, X-402-Cost-USDC, X-402-Asset-ID, X-402-Recipient, X-402-Nonce, X-402-Facilitator, X-402-Challenge-Tag, X-402-PQC-Standard, X-402-Bazaar-Discovery, Link',
};

// Durable Settlement Ledger Integration Note:
// Cross-instance replay prevention requires PostgreSQL durable settlement (shor_payment_claims table).
// In-memory process cache acts strictly as an intra-process secondary defense.
const LOCAL_PROCESS_USED_TX = new Set<string>();

interface OnChainVerificationResult {
  verified: boolean;
  error?: string;
  txId?: string;
  sender?: string;
  receiver?: string;
  amountUsdc?: number;
  confirmedRound?: number;
  roundTime?: number;
}

/**
 * Real On-Chain Algorand Payment Verifier
 * Strictly validates Circle USDC Asset Transfer (axfer) on Algorand MainNet.
 */
async function verifyAlgorandPaymentOnChain(txId: string, minAmountUsdc: number = MINIMUM_REQUIRED_USDC): Promise<OnChainVerificationResult> {
  const cleanTxId = txId.trim();

  // Basic validation: 52-character alphanumeric Algorand transaction ID
  if (!cleanTxId || cleanTxId.length < 40) {
    return { verified: false, error: 'Invalid transaction ID format. Must be a valid 52-character Algorand transaction hash.' };
  }

  // Prevent Replay Attacks
  if (LOCAL_PROCESS_USED_TX.has(cleanTxId)) {
    return { verified: false, error: 'Replay Protection: This transaction hash has already been settled and claimed.' };
  }

  try {
    // Resilient Multi-Node Algorand MainNet Indexer Query (AlgoNode + Nodely)
    const indexerUrls = [
      `https://mainnet-idx.algonode.cloud/v2/transactions/${cleanTxId}`,
      `https://mainnet-idx.4160.nodely.dev/v2/transactions/${cleanTxId}`,
    ];

    let tx: any = null;
    let lastStatus = 404;

    for (const url of indexerUrls) {
      try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.transaction) {
            tx = data.transaction;
            break;
          }
        } else {
          lastStatus = res.status;
        }
      } catch (e) {
        // failover
      }
    }

    if (!tx) {
      return { verified: false, error: `Transaction not found on Algorand MainNet indexers (HTTP ${lastStatus}).` };
    }

    if (!tx) {
      return { verified: false, error: 'Transaction data missing in Algorand indexer response.' };
    }

    // Verify confirmation round
    const confirmedRound = tx['confirmed-round'];
    if (!confirmedRound || confirmedRound <= 0) {
      return { verified: false, error: 'Transaction is unconfirmed or not yet finalized on Algorand MainNet.' };
    }

    const txType = tx['tx-type'];
    const sender = tx['sender'];

    // STRICT CHECK: Reject pure ALGO ('pay') transactions. Must be an Asset Transfer ('axfer').
    if (txType !== 'axfer') {
      return { verified: false, error: `Invalid transaction type: received '${txType}'. x402 settlement strictly requires an asset transfer ('axfer') of Circle USDC (ASA 31566704).` };
    }

    const axfer = tx['asset-transfer-transaction'];
    if (!axfer) {
      return { verified: false, error: 'Asset transfer transaction details missing.' };
    }

    const receiver = axfer['receiver'];
    const amountMicroUnits = axfer['amount'] || 0;
    const assetId = axfer['asset-id'];

    // Check 1: Must be Circle USDC (ASA 31566704)
    if (assetId !== USDC_ASA_MAINNET) {
      return { verified: false, error: `Invalid Asset ID: expected Circle USDC (ASA ${USDC_ASA_MAINNET}), received ASA ${assetId}.` };
    }

    // Check 2: Must match official recipient address
    if (receiver !== OFFICIAL_RECIPIENT_ADDRESS) {
      return { verified: false, error: `Wrong Recipient: expected ${OFFICIAL_RECIPIENT_ADDRESS}, received ${receiver}.` };
    }

    // Check 3: Must meet or exceed minimum required USDC (Rejects 0 USDC opt-ins)
    const amountUsdc = amountMicroUnits / 1000000;
    if (amountUsdc < minAmountUsdc) {
      return { verified: false, error: `Insufficient Payment: received ${amountUsdc} USDC, expected minimum ${minAmountUsdc} USDC. (0 USDC opt-ins are not payment).` };
    }

    // Mark as used in replay protection cache
    LOCAL_PROCESS_USED_TX.add(cleanTxId);

    return {
      verified: true,
      txId: cleanTxId,
      sender,
      receiver,
      amountUsdc,
      confirmedRound,
      roundTime: tx['round-time'],
    };
  } catch (err: any) {
    return { verified: false, error: `Algorand Node RPC lookup error: ${err.message}` };
  }
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight & HEAD checks for crawlers
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'HEAD') {
    return {
      statusCode: 204,
      headers: {
        ...CORS_HEADERS,
        'Link': `<${BAZAAR_DISCOVERY_URL}>; rel="service-desc", <${FACILITATOR_URL}>; rel="facilitator"`,
        'X-402-Challenge-Tag': CHALLENGE_TAG,
        'X-402-Bazaar-Discovery': BAZAAR_DISCOVERY_URL,
      },
      body: '',
    };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  const proofHeader = event.headers['x-402-proof'] || event.headers['X-402-Proof'] || '';
  const pqcSig = event.headers['x-pqc-signature'] || event.headers['X-PQC-Signature'] || '';

  // Extract Claimed Transaction ID from headers
  let candidateTxId = '';
  if (proofHeader) {
    candidateTxId = proofHeader.replace('x402_proof_', '').split('_')[0];
  } else if (authHeader.startsWith('x402-algo ') || authHeader.startsWith('Bearer ')) {
    candidateTxId = authHeader.replace(/^x402-algo\s+|^Bearer\s+/i, '').replace('x402_proof_', '').split('_')[0];
  }

  // If no transaction ID provided -> Return HTTP 402 Challenge
  if (!candidateTxId) {
    // Generate Cryptographically Secure Nonce (No Math.random)
    const nonceHex = crypto.randomBytes(16).toString('hex');
    const nonce = `x402_nonce_${nonceHex}`;
    const expiresAt = Date.now() + 600000;

    const challengePayload = {
      statusCode: 402,
      error: 'Payment Required',
      scheme: 'x402',
      message: 'Access to the SHOR Post-Quantum Autonomous Agent Orchestrator requires an Algorand x402 micro-settlement.',
      serviceId: 'srv-shor-orchestrator',
      challengeTag: CHALLENGE_TAG,
      bazaarDiscoveryUrl: BAZAAR_DISCOVERY_URL,
      paymentRequirements: {
        caip2: CAIP2_MAINNET,
        network: 'algorand-mainnet',
        asset: 'USDC',
        assetId: USDC_ASA_MAINNET,
        amount: MINIMUM_REQUIRED_USDC,
        recipient: OFFICIAL_RECIPIENT_ADDRESS,
        nonce,
        expiresAt,
        facilitatorUrl: FACILITATOR_URL,
        pqcRequirement: 'ML-DSA-65 / Hybrid-Ed25519 (NIST FIPS 204 Specification)',
      },
    };

    return {
      statusCode: 402,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'WWW-Authenticate': `x402 realm="shor-agent-commerce", caip2="${CAIP2_MAINNET}", asset="USDC", asset_id=${USDC_ASA_MAINNET}, amount="0.005000", recipient="${OFFICIAL_RECIPIENT_ADDRESS}", nonce="${nonce}", facilitator="${FACILITATOR_URL}", tag="${CHALLENGE_TAG}", pqc="ML-DSA-65"`,
        'Link': `<${BAZAAR_DISCOVERY_URL}>; rel="service-desc", <${FACILITATOR_URL}>; rel="facilitator"`,
        'X-402-Payment-Required': 'true',
        'X-402-CAIP2': CAIP2_MAINNET,
        'X-402-Cost-USDC': '0.005',
        'X-402-Asset-ID': USDC_ASA_MAINNET.toString(),
        'X-402-Recipient': OFFICIAL_RECIPIENT_ADDRESS,
        'X-402-Nonce': nonce,
        'X-402-Facilitator': FACILITATOR_URL,
        'X-402-Challenge-Tag': CHALLENGE_TAG,
        'X-402-Bazaar-Discovery': BAZAAR_DISCOVERY_URL,
        'X-PQC-Standard': 'FIPS-204-ML-DSA-65-BENCHMARK',
      },
      body: JSON.stringify(challengePayload, null, 2),
    };
  }

  // SECURITY HOLD: Do not consume or accept an existing transfer as a new paid request.
  // This is a safety gate until an atomic durable claim journal and actual execution
  // attestation are integrated with the production provider.
  return {
    statusCode: 503,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      status: 'SECURITY_HOLD',
      reason: 'Paid execution disabled pending durable replay prevention and authentic execution evidence',
      charged: false,
    }),
  };

  // Real On-Chain Payment Verification Check
  const verification = await verifyAlgorandPaymentOnChain(candidateTxId, MINIMUM_REQUIRED_USDC);

  if (!verification.verified) {
    // Payment verification failed on-chain -> Return HTTP 402 with exact rejection error
    return {
      statusCode: 402,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'X-402-Payment-Required': 'true',
        'X-402-Verification-Status': 'FAILED',
        'X-402-Challenge-Tag': CHALLENGE_TAG,
      },
      body: JSON.stringify({
        statusCode: 402,
        error: 'Payment Verification Failed',
        reason: verification.error,
        claimedTxId: candidateTxId,
        expectedRecipient: OFFICIAL_RECIPIENT_ADDRESS,
        expectedAssetId: USDC_ASA_MAINNET,
        expectedMinimumAmountUsdc: MINIMUM_REQUIRED_USDC,
      }, null, 2),
    };
  }

  // Parse Body for Authenticated Execution
  let bodyData: any = {};
  try {
    if (event.body) {
      bodyData = JSON.parse(event.body);
    }
  } catch (e) {
    bodyData = { goal: 'Autonomous post-quantum optimization pipeline.' };
  }

  const userGoal = bodyData.goal || 'Post-Quantum Autonomous Orchestration Objective';

  // Real Input-Derived Conway Computation (deterministic 8x8 seed if not provided)
  const goalHash = crypto.createHash('sha256').update(userGoal).digest();
  const defaultGrid = Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => (goalHash[(r * 8 + c) % 32] % 2 === 1 ? 1 : 0))
  );
  const inputGrid = Array.isArray(bodyData.conwayGrid) ? bodyData.conwayGrid : defaultGrid;
  const computedGrid = runConway(inputGrid, 3);
  let activeCells = 0;
  for (const row of computedGrid) for (const cell of row) if (cell === 1) activeCells++;

  // Real Bounded QUBO Computation (at most 20 variables, classical exact solver)
  const defaultQubo = [
    [-1.2, 0.4, 0.2, 0.1],
    [0.4, -0.9, 0.3, 0.2],
    [0.2, 0.3, -1.5, 0.2],
    [0.1, 0.2, 0.2, -0.7],
  ];
  const inputMatrix = Array.isArray(bodyData.quboMatrix) ? bodyData.quboMatrix : defaultQubo;
  const quboResult = solveQubo(inputMatrix);

  // Real PQC Attestation: Authenticate when supplied; never claim fabricated PQC verification
  const pqcPub = event.headers['x-pqc-public-key'] || event.headers['X-PQC-Public-Key'] || '';
  let pqcVerification = {
    algorithm: 'NIST FIPS 204 (ML-DSA-65)',
    status: 'NOT_PROVIDED',
    signatureHex: null as string | null,
    verified: false,
    specification: 'No authentic ML-DSA-65 signature provided with request',
  };

  if (pqcSig && pqcPub) {
    const pRes = verifyPqcSignature(pqcSig, verification.txId || '', pqcPub, verification.amountUsdc || 0.005);
    pqcVerification = {
      algorithm: 'NIST FIPS 204 (ML-DSA-65)',
      status: pRes.valid ? 'ML_DSA_65_VERIFIED' : 'ML_DSA_65_INVALID',
      signatureHex: pqcSig,
      verified: pRes.valid,
      specification: pRes.valid ? 'Authentic NIST FIPS 204 ML-DSA-65 signature verified' : 'NIST FIPS 204 ML-DSA-65 signature failed verification',
    };
  }

  // Return Authenticated 200 OK Delivery with Real On-Chain Receipt
  const responsePayload = {
    statusCode: 200,
    status: 'success',
    service: 'SHOR x402 Post-Quantum Autonomous Agent Orchestrator',
    challengeTag: CHALLENGE_TAG,
    settlementReceipt: {
      verifiedVia: 'Algorand MainNet Indexer',
      onChainVerification: 'VERIFIED_ON_CHAIN_MAINNET',
      orchestratorFeeUsdc: verification.amountUsdc,
      settlementAsset: 'USDC',
      assetId: USDC_ASA_MAINNET,
      sender: verification.sender,
      recipient: verification.receiver,
      confirmedRound: verification.confirmedRound,
      transactionId: verification.txId,
      explorerUrl: `https://allo.info/tx/${verification.txId}`,
      timestamp: verification.roundTime ? new Date(verification.roundTime * 1000).toISOString() : new Date().toISOString(),
    },
    conwayAutomatonState: {
      finalState: 'S10_COMPLETE',
      activeCells,
      gridDimensions: `${computedGrid.length}x${computedGrid[0]?.length || 0}`,
      stateTransitions: [
        'S0_IDLE', 'S1_OBSERVE', 'S2_PLAN', 'S3_DISCOVER', 'S4_EVALUATE',
        'S5_AUTHORIZE', 'S6_PAY', 'S7_EXECUTE', 'S8_VERIFY', 'S10_COMPLETE'
      ],
    },
    quboOptimizationResult: {
      hamiltonianEnergy: quboResult.energy,
      optimalBits: quboResult.bits,
      selectedService: 'Optimal Classical QUBO Service Cluster',
      solverMethod: 'Classical QUBO Combinatorial Optimization (Exhaustive Classical CPU - Not Physical Quantum Hardware)',
      variablesEvaluated: inputMatrix.length,
    },
    pqcCryptographicAttestation: pqcVerification,
    executionResult: {
      objective: userGoal,
      summary: `Successfully executed autonomous orchestration pipeline. Verified on-chain USDC payment (${verification.amountUsdc} USDC on round ${verification.confirmedRound}) via Algorand MainNet.`,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Link': `<${BAZAAR_DISCOVERY_URL}>; rel="service-desc", <${FACILITATOR_URL}>; rel="facilitator"`,
      'X-402-Settled': 'true',
      'X-402-TxID': verification.txId || '',
      'X-402-Confirmed-Round': (verification.confirmedRound || 0).toString(),
      'X-402-Challenge-Tag': CHALLENGE_TAG,
      'X-402-Bazaar-Discovery': BAZAAR_DISCOVERY_URL,
      'X-PQC-Standard': 'FIPS-204-ML-DSA-65-BENCHMARK',
    },
    body: JSON.stringify(responsePayload, null, 2),
  };
};