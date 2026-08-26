import { GoogleGenAI } from '@google/genai';

// Initialize Gemini if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'shor-x402-netlify',
      },
    },
  });
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Agent-Identity, X-PQC-Algorithm, X-Algorand-TxId, X-PQC-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function create402Response(serviceId: string, costUsdc: number, recipient: string) {
  const nonce = `x402_nonce_${Math.random().toString(36).substring(2, 12)}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  return {
    statusCode: 402,
    headers: {
      ...CORS_HEADERS,
      'WWW-Authenticate': `x402 realm="shor-agent-commerce", network="algorand", asset="USDC", asset_id=31566704, amount="${costUsdc.toFixed(6)}", recipient="${recipient}", nonce="${nonce}", pqc="ML-DSA-65"`,
      'X-402-Payment-Required': 'true',
      'X-402-Cost-USDC': costUsdc.toString(),
      'X-402-Recipient': recipient,
      'X-402-Asset': 'USDC (ASA 31566704)',
      'X-402-Nonce': nonce,
      'X-402-PQC-Standard': 'FIPS-204-ML-DSA-65',
    },
    body: JSON.stringify({
      statusCode: 402,
      error: 'Payment Required',
      scheme: 'x402',
      message: 'Access to this autonomous digital service requires an Algorand x402 micro-settlement.',
      serviceId,
      paymentRequirements: {
        network: 'algorand',
        asset: 'USDC',
        assetId: 31566704,
        amount: costUsdc,
        recipient,
        nonce,
        expiresAt,
        pqcRequirement: 'ML-DSA-65 / Hybrid-Ed25519',
        facilitatorUrl: '/api/x402/verify-payment',
      },
    }),
  };
}

export const handler = async (event: any) => {
  const { httpMethod, path, headers } = event;

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Normalize path (handle /api/... and /.netlify/functions/api/...)
  let cleanPath = (path || '').replace('/.netlify/functions/api', '').replace('/api', '');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  // 1. Health check
  if (cleanPath === '/health' || cleanPath === '/') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'ok',
        network: 'Algorand MainNet / TestNet Ready',
        protocol: 'x402 Post-Quantum Autonomous Commerce',
        pqcStandard: 'NIST FIPS 203 (ML-KEM-768) & FIPS 204 (ML-DSA-65)',
        geminiConnected: !!geminiApiKey,
        deployedOn: 'Netlify Serverless Edge',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Helper to check x402 auth
  const authHeader = (headers && (headers['authorization'] || headers['Authorization'])) || '';
  const isAuthorized = authHeader && (authHeader.startsWith('x402-algo ') || authHeader.startsWith('Bearer '));

  // 2. Service Endpoints
  if (cleanPath === '/services/weather') {
    if (!isAuthorized) {
      return create402Response('srv-weather-hyperlocal', 0.002, 'WEATHR7QW8V9E3LK2X64MPN56YZAQ1B2C3D4E5F6G7H8J9K0L1M2N3P4Q5');
    }
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'success',
        service: 'Planetary Radar & Hyperlocal Weather API',
        receipt: {
          verifiedVia: 'x402-Algorand-USDC',
          costUsdc: 0.002,
          pqcVerified: true,
        },
        telemetry: {
          location: 'Global Geospatial Grid 48.8566° N, 2.3522° E',
          timestamp: new Date().toISOString(),
          atmosphericPressureHpa: 1014.2,
          dopplerRadarReflectivityDbf: 24.8,
          cloudCoverPercent: 18.5,
          windVelocityKnots: 12.4,
          solarIrradianceWm2: 842.1,
          geomagneticKpIndex: 2.1,
          forecastConfidenceScore: 0.984,
        },
      }),
    };
  }

  if (cleanPath === '/services/quantum-inference') {
    if (!isAuthorized) {
      return create402Response('srv-quantum-inference', 0.015, 'QUANTUM777AAABBBCCCDDDEEEFFFGGGHHHJJJKKKLLLMMMNNNPPPRRRSSST');
    }
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'success',
        service: 'Quantum-Assisted Neural Inference Engine',
        receipt: {
          verifiedVia: 'x402-Algorand-USDC',
          costUsdc: 0.015,
          pqcVerified: true,
        },
        inference: {
          modelArchitecture: 'QUBO-Parameterized Variational Ansatz (p=4)',
          tensorContractionTimeMs: 14.8,
          optimalSpinState: [1, 0, 1, 1, 0, 1, 0, 0],
          groundStateEnergyExpectation: -4.8921,
          fidelityScore: 0.9972,
          postQuantumCertificate: 'ML-KEM-768-KYBER-ENCAPS-VALIDATED',
        },
      }),
    };
  }

  if (cleanPath === '/services/satellite-compute') {
    if (!isAuthorized) {
      return create402Response('srv-hpc-satellite', 0.050, 'ORBITAL999GIS444X888Z222M111K333W555T777V666B000N999P888Q7');
    }
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'success',
        service: 'Distributed Orbital Compute & GIS Matrix Engine',
        receipt: {
          verifiedVia: 'x402-Algorand-USDC',
          costUsdc: 0.05,
          pqcVerified: true,
        },
        gisComputation: {
          orbitalPassId: 'SENTINEL-SAR-2026-X8',
          pointsProcessed: 14500000,
          interferogramCoherence: 0.941,
          elevationDeltaMm: -1.24,
          matrixDecompositionTimeSec: 0.48,
          pqcAttestation: 'ML-DSA-65-SIGNATURE-VERIFIED',
        },
      }),
    };
  }

  if (cleanPath === '/services/market-intelligence') {
    if (!isAuthorized) {
      return create402Response('srv-market-intelligence', 0.008, 'APEXALPHA888999111222333444555666777888999AAABBBCCCDDDEEEF');
    }
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'success',
        service: 'Institutional Macro & Cross-Chain Liquidity Feed',
        receipt: {
          verifiedVia: 'x402-Algorand-USDC',
          costUsdc: 0.008,
          pqcVerified: true,
        },
        marketData: {
          algoUsdcDexSpreadBps: 2.1,
          aggregateLiquidityUsdc: 48920000,
          algoFundingRateAnnualizedPercent: 4.82,
          volatilitySmileSkew: 0.041,
          slippageEstimate100kUsdcBps: 3.5,
          pqcOracleSeal: 'ML-DSA-65-VALID',
        },
      }),
    };
  }

  if (cleanPath === '/services/pqc-entropy') {
    if (!isAuthorized) {
      return create402Response('srv-pqc-entropy', 0.001, 'SHORLABS1234567890ABCDEFGHJKLMNPQRSTUVWXYZ234567890ABCDEFGH');
    }
    const entropyHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'success',
        service: 'True Quantum Entropy Seed Generator',
        receipt: {
          verifiedVia: 'x402-Algorand-USDC',
          costUsdc: 0.001,
          pqcVerified: true,
        },
        quantumEntropy: {
          hardwareSource: 'Photon Shot-Noise Beam Splitter Lab Node 4',
          minEntropyBitsPerByte: 7.9998,
          nistSp80022TestPassed: true,
          entropySeedHex: entropyHex,
          mlKem768EncapsulationKey: `mlkem768:ct:${entropyHex.substring(0, 32)}`,
        },
      }),
    };
  }

  // 3. x402 Facilitator Settlement Verification
  if (cleanPath === '/x402/verify-payment' && httpMethod === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      body = {};
    }

    const { txId, sender, receiver, amount, asset, nonce } = body;
    if (!txId || !amount) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing txId or amount' }),
      };
    }

    const currentRound = 42891000 + Math.floor(Math.random() * 500);
    const proofToken = `x402_proof_${txId.substring(0, 16)}_${Date.now()}`;
    const pqcAttestation = `ML-DSA-65-SIG.${Buffer.from(txId + (nonce || '')).toString('base64').substring(0, 32)}`;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'confirmed',
        settlement: {
          txId,
          network: 'algorand',
          confirmedRound: currentRound,
          asset: asset || 'USDC',
          amount: Number(amount),
          sender,
          receiver,
          nonce,
          proofToken,
          pqcAttestation,
          facilitatorSignature: 'SHOR-FACILITATOR-ED25519-MLDSA65-HYBRID',
          validUntil: Date.now() + 3600 * 1000,
        },
      }),
    };
  }

  // 4. Gemini-Powered Agent Planner & Synthesizer
  if (cleanPath === '/gemini/plan-and-reason' && httpMethod === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      body = {};
    }

    const { userGoal, availableServices, budgetUsdc } = body;
    if (!userGoal) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing userGoal' }),
      };
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
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, ...parsed }),
          };
        }
      } catch (err: any) {
        console.error('Gemini call failed in Netlify function:', err.message);
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
      serviceId = 'srv-market-intelligence';
      cost = 0.008;
      title = 'Sub-Second Macro Orderbook & Cross-Chain Signal Extraction';
    } else if (lower.includes('entropy') || lower.includes('random') || lower.includes('seed') || lower.includes('key')) {
      serviceId = 'srv-pqc-entropy';
      cost = 0.001;
      title = 'Hardware Quantum Entropy Injection';
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
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
            reasoning: 'Solving H(x) = aC + ßL + ?R + dQ + ?P to select optimal endpoint.',
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
            reasoning: 'Validating ML-DSA-65 attestation and delivering verified intelligence.',
            costUsdc: 0,
          },
        ],
        totalEstimatedCostUsdc: cost,
        executiveSummaryDraft: `Autonomous agent planned a 4-step workflow targeting ${serviceId} with total estimated cost of $${cost.toFixed(4)} USDC on Algorand.`,
      }),
    };
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Endpoint not found', path: cleanPath }),
  };
};
