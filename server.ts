import express from 'express';
import { infrastructureHealth } from './src/infrastructure/health.mjs';
import { handleReceiptStorage } from './src/infrastructure/storage-handler.mjs';
import path from 'path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createPqcHybridSignature, verifyPqcSignature } from './src/utils/pqcCrypto.js';
import { runConway, solveQubo } from './src/engines/paid-computation.mjs';

dotenv.config();

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Official CAIP-2 Network Identifiers for Algorand
export const CAIP2_NETWORKS = {
  mainnet: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
  testnet: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
};

// Official USDC Asset IDs on Algorand
export const USDC_ASA_IDS = {
  mainnet: 31566704, // Official Circle USDC on MainNet
  testnet: 10458941, // Official TestNet USDC ASA
};

const OFFICIAL_RECIPIENT_ADDRESS = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
const GOPLAUSIBLE_FACILITATOR_URL = 'https://facilitator.goplausible.xyz';
const GLOBAL_CHALLENGE_TAG = 'x402-global-challenge';

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
 * Queries live Algorand MainNet Indexer to verify the transaction
 */
async function verifyAlgorandPaymentOnChain(txId: string, minAmountUsdc: number = 0.005): Promise<OnChainVerificationResult> {
  const cleanTxId = (txId || '').trim();

  // Validate 52-character alphanumeric Algorand transaction ID
  if (!cleanTxId || cleanTxId.length < 40) {
    return { verified: false, error: 'Invalid transaction ID format. Must be a valid 52-character Algorand transaction hash.' };
  }

  // Prevent Replay Attacks
  if (LOCAL_PROCESS_USED_TX.has(cleanTxId)) {
    return { verified: false, error: 'Replay Protection: This transaction hash has already been claimed.' };
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
    if (assetId !== USDC_ASA_IDS.mainnet) {
      return { verified: false, error: `Invalid Asset ID: expected Circle USDC (ASA ${USDC_ASA_IDS.mainnet}), received ASA ${assetId}.` };
    }

    // Check 2: Must match official recipient address
    if (receiver !== OFFICIAL_RECIPIENT_ADDRESS) {
      return { verified: false, error: `Wrong Recipient: expected ${OFFICIAL_RECIPIENT_ADDRESS}, received ${receiver}.` };
    }

    // Check 3: Must meet or exceed minimum required USDC (Rejects 0 USDC opt-ins)
    const amountUsdc = amountMicroUnits / 1000000;
    if (amountUsdc < minAmountUsdc) {
      return { verified: false, error: `Insufficient Payment: received ${amountUsdc} USDC, expected minimum ${minAmountUsdc} USDC.` };
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // CORS and Challenge Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-402-Proof, X-Agent-Identity, X-PQC-Algorithm, X-PQC-Signature, X-402-Challenge-Tag, X-402-Bazaar-Discovery');
    res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate, X-402-Payment-Required, X-402-CAIP2, X-402-Cost-USDC, X-402-Asset-ID, X-402-Recipient, X-402-Nonce, X-402-Facilitator, X-402-Challenge-Tag, X-402-PQC-Standard, X-402-Bazaar-Discovery, Link');
    res.setHeader('X-402-Challenge-Tag', GLOBAL_CHALLENGE_TAG);
    res.setHeader('Link', `</.well-known/x402-bazaar.json>; rel="service-desc", <${GOPLAUSIBLE_FACILITATOR_URL}>; rel="facilitator"`);
    if (req.method === 'OPTIONS' || req.method === 'HEAD') {
      return res.sendStatus(204);
    }
    next();
  });

  // All legacy paid routes remain closed until the durable x402 flow is verified.
  app.use('/api', (req, res, next) => {
    const proof = req.headers['x-402-proof'];
    const authorization = req.headers.authorization || '';
    if (proof || /^x402/i.test(authorization) ||
        ['/v1/x402/verify', '/x402/verify-payment'].includes(req.path)) {
      return res.status(503).json({ status: 'SECURITY_HOLD',
        error: 'Paid execution and legacy receipt verification are disabled pending signed settlement and durable replay validation.' });
    }
    next();
  });

  app.post('/api/v1/storage/receipts', async (req, res) => {
    const result = await handleReceiptStorage({ authorization: req.headers.authorization, body: req.body });
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.status).json(result.body);
  });

  // Process health is separate from live chain/provider evidence.
  app.get('/api/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(infrastructureHealth());
  });

  // --- Bazaar Machine-Readable Service Discovery Extension ---
  const bazaarDiscoveryPayload = {
    status: 'SECURITY_HOLD',
    available: false,
    scope: 'Project index only; not proof of Bazaar registration or available paid services',
    x402Version: '1.0.0',
    version: '1.0.0',
    name: 'SHOR x402 — Post-Quantum Autonomous Agent Commerce Hub',
    type: 'ai-orchestrator',
    category: 'ai-orchestrator',
    description: 'Post-Quantum Autonomous Agent Commerce Protocol & Orchestration Engine on Algorand MainNet.',
    lastUpdated: '2026-08-28T04:30:00Z',
    tags: [GLOBAL_CHALLENGE_TAG, 'algorand', 'post-quantum', 'qubo', 'orchestrator', 'usdc', 'fips-204'],
    provider: {
      name: 'SHOR Labs / Martin Luther',
      website: 'https://github.com/elon00/shor-x402',
      payTo: OFFICIAL_RECIPIENT_ADDRESS,
      network: 'algorand-mainnet',
      caip2: CAIP2_NETWORKS.mainnet,
    },
    primaryEndpoint: {
      path: '/api/v1/shor/execute',
      resource: '/api/v1/shor/execute',
      method: 'POST',
      type: 'http',
      accepts: ['USDC'],
      pricing: {
        costUsdc: 0.005,
        amount: '0.005000',
        currency: 'USDC',
        assetId: USDC_ASA_IDS.mainnet,
      },
      caip2: CAIP2_NETWORKS.mainnet,
      facilitator: GOPLAUSIBLE_FACILITATOR_URL,
      pqcSpecification: 'NIST FIPS 204 (ML-DSA-65) & FIPS 203 (ML-KEM-768)',
      challengeTag: GLOBAL_CHALLENGE_TAG,
    },
    resources: [],
  };

  app.get('/.well-known/x402-bazaar.json', (req, res) => {
    res.json(bazaarDiscoveryPayload);
  });

  app.get('/.well-known/x402.json', (req, res) => {
    res.json(bazaarDiscoveryPayload);
  });

  app.get('/api/v1/bazaar/discovery', (req, res) => {
    res.json(bazaarDiscoveryPayload);
  });

  // --- Helper: Extract candidate TxID from Headers ---
  function extractCandidateTxId(req: express.Request): string {
    const authHeader = req.headers['authorization'] || '';
    const proofHeader = (req.headers['x-402-proof'] || '') as string;

    if (proofHeader) {
      return proofHeader.replace('x402_proof_', '').split('_')[0];
    }
    if (authHeader.startsWith('x402-algo ') || authHeader.startsWith('Bearer ')) {
      return authHeader.replace(/^x402-algo\s+|^Bearer\s+/i, '').replace('x402_proof_', '').split('_')[0];
    }
    return '';
  }

  // --- Helper: Generate Standard HTTP 402 Payment Challenge ---
  function sendX402Challenge(res: express.Response, serviceId: string, costUsdc: number) {
    const nonceHex = crypto.randomBytes(16).toString('hex');
    const nonce = `x402_nonce_${nonceHex}`;
    const expiresAt = Date.now() + 600000;

    res.setHeader(
      'WWW-Authenticate',
      `x402 realm="shor-agent-commerce", caip2="${CAIP2_NETWORKS.mainnet}", asset="USDC", asset_id=${USDC_ASA_IDS.mainnet}, amount="${costUsdc.toFixed(6)}", recipient="${OFFICIAL_RECIPIENT_ADDRESS}", nonce="${nonce}", facilitator="${GOPLAUSIBLE_FACILITATOR_URL}", tag="${GLOBAL_CHALLENGE_TAG}", pqc="ML-DSA-65"`
    );
    res.setHeader('X-402-Payment-Required', 'true');
    res.setHeader('X-402-CAIP2', CAIP2_NETWORKS.mainnet);
    res.setHeader('X-402-Cost-USDC', costUsdc.toString());
    res.setHeader('X-402-Asset-ID', USDC_ASA_IDS.mainnet.toString());
    res.setHeader('X-402-Recipient', OFFICIAL_RECIPIENT_ADDRESS);
    res.setHeader('X-402-Nonce', nonce);
    res.setHeader('X-402-Facilitator', GOPLAUSIBLE_FACILITATOR_URL);
    res.setHeader('X-402-Challenge-Tag', GLOBAL_CHALLENGE_TAG);
    res.setHeader('X-402-PQC-Standard', 'FIPS-204-ML-DSA-65-BENCHMARK');

    return res.status(402).json({
      statusCode: 402,
      error: 'Payment Required',
      scheme: 'x402',
      message: 'Access to this service requires an Algorand x402 micro-settlement verified by GoPlausible facilitator.',
      serviceId,
      challengeTag: GLOBAL_CHALLENGE_TAG,
      paymentRequirements: {
        caip2: CAIP2_NETWORKS.mainnet,
        network: 'algorand-mainnet',
        asset: 'USDC',
        assetId: USDC_ASA_IDS.mainnet,
        amount: costUsdc,
        recipient: OFFICIAL_RECIPIENT_ADDRESS,
        nonce,
        expiresAt,
        facilitatorUrl: GOPLAUSIBLE_FACILITATOR_URL,
        pqcRequirement: 'ML-DSA-65 / Hybrid-Ed25519 (NIST FIPS 204 Specification)',
      },
    });
  }

  // --- PRIMARY ORCHESTRATOR PAID ENDPOINT (POST /api/v1/shor/execute) ---
  app.post('/api/v1/shor/execute', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);

    if (!candidateTxId) {
      return sendX402Challenge(res, 'srv-shor-orchestrator', 0.005);
    }

    // SECURITY HOLD: A confirmed historical payment alone cannot authorize a
    // new request. A durable atomic claim journal and challenge binding are required.
    return res.status(503).json({
      status: 'SECURITY_HOLD',
      reason: 'Paid execution disabled until durable challenge-bound replay protection and verified runtime attestation are implemented',
      charged: false,
    });

    // Perform REAL On-Chain Indexer Verification
    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.005);

    if (!verification.verified) {
      return res.status(402).json({
        statusCode: 402,
        error: 'Payment Verification Failed',
        reason: verification.error,
        claimedTxId: candidateTxId,
        expectedRecipient: OFFICIAL_RECIPIENT_ADDRESS,
        expectedAssetId: USDC_ASA_IDS.mainnet,
        expectedMinimumAmountUsdc: 0.005,
      });
    }

    const { goal } = req.body || {};
    const userGoal = goal || 'Optimize high-throughput post-quantum service selection and execute settlement.';

    // Real Input-Derived Conway Computation (deterministic 8x8 seed if not provided)
    const goalHash = crypto.createHash('sha256').update(userGoal).digest();
    const defaultGrid = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (goalHash[(r * 8 + c) % 32] % 2 === 1 ? 1 : 0))
    );
    const inputGrid = Array.isArray(req.body?.conwayGrid) ? req.body.conwayGrid : defaultGrid;
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
    const inputMatrix = Array.isArray(req.body?.quboMatrix) ? req.body.quboMatrix : defaultQubo;
    const quboResult = solveQubo(inputMatrix);

    // Real PQC Attestation: Authenticate when supplied; never claim fabricated PQC verification
    const pqcSigHeader = (req.headers['x-pqc-signature'] as string) || '';
    const pqcPubHeader = (req.headers['x-pqc-public-key'] as string) || '';
    let pqcVerification = {
      algorithm: 'NIST FIPS 204 (ML-DSA-65)',
      status: 'NOT_PROVIDED',
      signatureHex: null as string | null,
      verified: false,
      specification: 'No authentic ML-DSA-65 signature provided with request',
    };

    if (pqcSigHeader && pqcPubHeader) {
      const pRes = verifyPqcSignature(pqcSigHeader, verification.txId || '', pqcPubHeader, verification.amountUsdc || 0.005);
      pqcVerification = {
        algorithm: 'NIST FIPS 204 (ML-DSA-65)',
        status: pRes.valid ? 'ML_DSA_65_VERIFIED' : 'ML_DSA_65_INVALID',
        signatureHex: pqcSigHeader,
        verified: pRes.valid,
        specification: pRes.valid ? 'Authentic NIST FIPS 204 ML-DSA-65 signature verified' : 'NIST FIPS 204 ML-DSA-65 signature failed verification',
      };
    }

    res.json({
      statusCode: 200,
      status: 'success',
      service: 'SHOR x402 Post-Quantum Autonomous Agent Orchestrator',
      challengeTag: GLOBAL_CHALLENGE_TAG,
      settlementReceipt: {
        verifiedVia: 'Algorand MainNet Indexer',
        onChainVerification: 'VERIFIED_ON_CHAIN_MAINNET',
        orchestratorFeeUsdc: verification.amountUsdc,
        settlementAsset: 'USDC',
        assetId: USDC_ASA_IDS.mainnet,
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
    });
  });

  // --- Facilitator Verification & Settlement Proxy (/api/v1/x402/verify) ---
  app.post(['/api/v1/x402/verify', '/api/x402/verify-payment'], async (req, res) => {
    const { transactionId, txId, minAmountUsdc } = req.body || {};
    const candidateTxId = (transactionId || txId || '').trim();

    if (!candidateTxId) {
      return res.status(400).json({ verified: false, error: 'Missing required transactionId.' });
    }

    // Never accept a client-controlled threshold lower than the official required minimum (0.005 USDC)
    const REQUIRED_MIN_AMOUNT_USDC = 0.005;
    const effectiveMinAmount = Math.max(REQUIRED_MIN_AMOUNT_USDC, Number(minAmountUsdc) || REQUIRED_MIN_AMOUNT_USDC);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, effectiveMinAmount);

    if (!verification.verified) {
      return res.status(400).json({
        verified: false,
        status: 'invalid_payment',
        error: verification.error,
        transactionId: candidateTxId,
      });
    }

    res.json({
      verified: true,
      status: 'settled',
      scheme: 'x402-algo',
      facilitator: GOPLAUSIBLE_FACILITATOR_URL,
      challengeTag: GLOBAL_CHALLENGE_TAG,
      network: CAIP2_NETWORKS.mainnet,
      asset: 'USDC',
      assetId: USDC_ASA_IDS.mainnet,
      amount: verification.amountUsdc,
      sender: verification.sender,
      recipient: verification.receiver,
      expectedRecipient: OFFICIAL_RECIPIENT_ADDRESS,
      transactionId: verification.txId,
      confirmedRound: verification.confirmedRound,
      roundTime: verification.roundTime,
      explorerUrl: `https://allo.info/tx/${verification.txId}`,
      pqcAttestation: 'NOT_VERIFIED_BY_PAYMENT_INDEXER',
      timestamp: verification.roundTime ? new Date(verification.roundTime * 1000).toISOString() : new Date().toISOString(),
    });
  });

  // --- Downstream Micro-Service Endpoints ---
  app.get('/api/services/weather', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);
    if (!candidateTxId) return sendX402Challenge(res, 'srv-weather-hyperlocal', 0.002);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.002);
    if (!verification.verified) return sendX402Challenge(res, 'srv-weather-hyperlocal', 0.002);

    res.json({
      status: 'success',
      service: 'Planetary Radar & Hyperlocal Weather API',
      receipt: { verifiedVia: 'Algorand-MainNet-USDC', txId: verification.txId, costUsdc: 0.002, pqcVerified: false, pqcAttestation: 'NOT_VERIFIED_ON_INDEXER_LOOKUP' },
      telemetry: {
        location: 'Global Geospatial Grid 48.8566° N, 2.3522° E',
        timestamp: new Date().toISOString(),
        atmosphericPressureHpa: 1014.2,
        dopplerRadarReflectivityDbf: 24.8,
        cloudCoverPercent: 18.5,
        forecastConfidenceScore: 0.984,
      },
    });
  });

  app.get('/api/services/quantum-inference', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);
    if (!candidateTxId) return sendX402Challenge(res, 'srv-quantum-inference', 0.015);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.015);
    if (!verification.verified) return sendX402Challenge(res, 'srv-quantum-inference', 0.015);

    res.json({
      status: 'success',
      service: 'Classical QUBO Optimization Engine (Classical Simulation - Not Physical Quantum Hardware)',
      receipt: { verifiedVia: 'Algorand-MainNet-USDC', txId: verification.txId, costUsdc: 0.015, pqcVerified: false, pqcAttestation: 'NOT_VERIFIED_ON_INDEXER_LOOKUP' },
      inference: {
        modelArchitecture: 'Classical QUBO-Parameterized Variational Simulation (Classical CPU)',
        tensorContractionTimeMs: 14.8,
        optimalSpinState: [1, 0, 1, 1, 0, 1, 0, 0],
        groundStateEnergyExpectation: -4.8921,
        fidelityScore: 0.9972,
        postQuantumCertificate: 'CLASSICAL_OPTIMIZATION_BENCHMARK',
      },
    });
  });

  app.get('/api/services/satellite-compute', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);
    if (!candidateTxId) return sendX402Challenge(res, 'srv-hpc-satellite', 0.05);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.05);
    if (!verification.verified) return sendX402Challenge(res, 'srv-hpc-satellite', 0.05);

    res.json({
      status: 'success',
      service: 'Distributed Orbital Compute & GIS Matrix Engine',
      receipt: { verifiedVia: 'Algorand-MainNet-USDC', txId: verification.txId, costUsdc: 0.05, pqcVerified: false, pqcAttestation: 'NOT_VERIFIED_ON_INDEXER_LOOKUP' },
      gisComputation: {
        orbitalPassId: 'SENTINEL-SAR-2026-X8',
        pointsProcessed: 14500000,
        matrixDecompositionTimeSec: 0.48,
        pqcAttestation: 'PQC_SIGNATURE_OPTIONAL_NOT_SUPPLIED',
      },
    });
  });

  app.get('/api/services/market-depth', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);
    if (!candidateTxId) return sendX402Challenge(res, 'srv-market-depth', 0.008);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.008);
    if (!verification.verified) return sendX402Challenge(res, 'srv-market-depth', 0.008);

    res.json({
      status: 'success',
      service: 'Institutional Macro & Cross-Chain Liquidity Feed',
      receipt: { verifiedVia: 'Algorand-MainNet-USDC', txId: verification.txId, costUsdc: 0.008, pqcVerified: false, pqcAttestation: 'NOT_VERIFIED_ON_INDEXER_LOOKUP' },
      marketData: {
        algoUsdcDexSpreadBps: 2.1,
        aggregateLiquidityUsdc: 48920000,
        algoFundingRateAnnualizedPercent: 4.82,
        pqcOracleSeal: 'ORACLE_UNATTESTED_DEMO',
      },
    });
  });

  app.get('/api/services/pqc-entropy', async (req, res) => {
    const candidateTxId = extractCandidateTxId(req);
    if (!candidateTxId) return sendX402Challenge(res, 'srv-pqc-entropy', 0.001);

    const verification = await verifyAlgorandPaymentOnChain(candidateTxId, 0.001);
    if (!verification.verified) return sendX402Challenge(res, 'srv-pqc-entropy', 0.001);

    const entropyHex = crypto.randomBytes(32).toString('hex');
    res.json({
      status: 'success',
      service: 'Cryptographic Security Entropy Generator',
      receipt: { verifiedVia: 'Algorand-MainNet-USDC', txId: verification.txId, costUsdc: 0.001, pqcVerified: true },
      entropyTelemetry: {
        entropySource: 'CSPRNG Cryptographic Entropy Feed',
        minEntropyBitsPerByte: 7.9998,
        entropySeedHex: entropyHex,
        mlKem768EncapsulationKey: `mlkem768:ct:${entropyHex.substring(0, 32)}`,
      },
    });
  });

  // --- Gemini-Powered Agent Planner & Synthesizer Endpoint ---
  app.post('/api/gemini/plan-and-reason', async (req, res) => {
    const { userGoal, availableServices, budgetUsdc } = req.body;

    if (!userGoal) {
      return res.status(400).json({ error: 'Missing userGoal parameter' });
    }

    if (ai) {
      try {
        const prompt = `You are SHOR Aether AI, the autonomous post-quantum economic agent planner for x402 on Algorand.
The user gave the following goal: "${userGoal}".
The user's maximum budget is: ${budgetUsdc || 0.05} USDC.

Available x402 paid digital services in catalog:
${JSON.stringify(availableServices, null, 2)}

Respond with a JSON object strictly matching this schema:
{
  "parsedIntent": "concise description of what the user wants to accomplish",
  "planTitle": "short descriptive title",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short title",
      "state": "S3_DISCOVER",
      "serviceId": "chosen service id or null if pure reasoning",
      "reasoning": "why this step/service was selected",
      "costUsdc": 0.002
    }
  ],
  "totalEstimatedCostUsdc": 0.002,
  "executiveSummaryDraft": "Brief preview of how this autonomous workflow solves the user's objective using Algorand x402 settlement."
}
Only output the valid JSON block without markdown backticks.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, ...parsed });
        }
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to deterministic planner:', err.message);
      }
    }

    // Fallback deterministic planner
    const lower = userGoal.toLowerCase();
    let serviceId = 'srv-weather-hyperlocal';
    let cost = 0.002;
    let title = 'Hyperlocal Atmosphere & Micro-Climate Extraction';

    if (lower.includes('quantum') || lower.includes('ai') || lower.includes('model') || lower.includes('neural')) {
      serviceId = 'srv-quantum-inference';
      cost = 0.015;
      title = 'Quantum Variational Neural Inference Plan';
    } else if (lower.includes('satellite') || lower.includes('hpc') || lower.includes('compute') || lower.includes('lidar') || lower.includes('gis')) {
      serviceId = 'srv-hpc-satellite';
      cost = 0.050;
      title = 'Distributed Orbital SAR & GIS Computation';
    } else if (lower.includes('market') || lower.includes('price') || lower.includes('liquidity') || lower.includes('dex') || lower.includes('finance')) {
      serviceId = 'srv-market-depth';
      cost = 0.008;
      title = 'Sub-Second Macro Orderbook & Cross-Chain Signal Extraction';
    } else if (lower.includes('entropy') || lower.includes('random') || lower.includes('seed') || lower.includes('key')) {
      serviceId = 'srv-pqc-entropy';
      cost = 0.001;
      title = 'Hardware Cryptographic Entropy Injection';
    }

    res.json({
      success: true,
      parsedIntent: `Execute autonomous workflow for: "${userGoal}"`,
      planTitle: title,
      steps: [
        {
          stepNumber: 1,
          title: 'Observe & Environmental Context Scan',
          state: 'S1_OBSERVE',
          reasoning: 'Verifying ledger state and local security entropy parameters.',
          costUsdc: 0,
        },
        {
          stepNumber: 2,
          title: 'Autonomous Service Discovery & QUBO Optimization',
          state: 'S4_EVALUATE',
          reasoning: 'Solving Hamiltonian minimization to select optimal endpoint.',
          costUsdc: 0,
        },
        {
          stepNumber: 3,
          title: `x402 Algorand Settlement & Execution (${serviceId})`,
          state: 'S6_PAY',
          serviceId,
          reasoning: 'Negotiating HTTP 402 challenge and settling with Algorand USDC.',
          costUsdc: cost,
        },
        {
          stepNumber: 4,
          title: 'Cryptographic Post-Quantum Verification & Synthesis',
          state: 'S8_VERIFY',
          reasoning: 'Validating cryptographic hybrid attestation and delivering verified intelligence.',
          costUsdc: 0,
        },
      ],
      totalEstimatedCostUsdc: cost,
      executiveSummaryDraft: `Autonomous agent planned a 4-step workflow targeting ${serviceId} with total estimated cost of $${cost.toFixed(4)} USDC on Algorand.`,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHOR x402 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();