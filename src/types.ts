export type NetworkMode = 'algorand-mainnet' | 'algorand-testnet' | 'algorand-devnet';

export type PaymentAsset = 'USDC' | 'ALGO';

export type AgentStateId =
  | 'S0_IDLE'
  | 'S1_OBSERVE'
  | 'S2_PLAN'
  | 'S3_DISCOVER'
  | 'S4_EVALUATE'
  | 'S5_AUTHORIZE'
  | 'S6_PAY'
  | 'S7_EXECUTE'
  | 'S8_VERIFY'
  | 'S9_RECOVER'
  | 'S10_COMPLETE';

export interface AgentStateInfo {
  id: AgentStateId;
  label: string;
  code: string;
  description: string;
  color: string;
}

export interface PaidService {
  id: string;
  name: string;
  provider: string;
  category: 'weather' | 'quantum-ai' | 'hpc-compute' | 'market-data' | 'pqc-entropy' | 'custom';
  endpoint: string;
  description: string;
  costUsdc: number;
  costAlgo: number;
  latencyMs: number;
  riskScore: number; // 0 (safest) to 1.0 (riskiest)
  pqcScore: number; // 0 to 1.0 (1.0 = fully ML-DSA-65 / ML-KEM-768 compliant)
  reliability: number; // 0 to 1.0
  pqcAlgorithm: string;
  recipientAddress: string;
  available: boolean;
}

export interface QuboWeights {
  alpha: number; // Cost weight C(x)
  beta: number;  // Latency weight L(x)
  gamma: number; // Risk weight R(x)
  delta: number; // Security/PQC exposure Q(x)
  lambda: number; // Policy violation penalty P(x)
}

export interface OptimizationResult {
  selectedServiceId: string;
  selectedService: PaidService;
  energyH: number;
  costComponent: number;
  latencyComponent: number;
  riskComponent: number;
  pqcComponent: number;
  penaltyComponent: number;
  solverType: 'classical-greedy' | 'qubo-annealing' | 'qaoa-quantum';
  solverTimeMs: number;
  matrixQ: number[][];
  candidateEnergies: {
    serviceId: string;
    serviceName: string;
    energy: number;
    cost: number;
    latency: number;
    pqcScore: number;
  }[];
}

export interface X402Challenge {
  statusCode: 402;
  scheme: 'x402';
  network: string;
  asset: PaymentAsset;
  assetId?: number; // Algorand ASA ID (e.g. 31566704 for USDC)
  amount: number;
  recipient: string;
  nonce: string;
  expiresAt: number;
  serviceId: string;
  facilitatorUrl: string;
  pqcRequirement: string;
}

export interface AlgorandTransaction {
  txId: string;
  sender: string;
  receiver: string;
  asset: PaymentAsset;
  amount: number;
  feeAlgo: number;
  confirmedRound: number;
  timestamp: string;
  note: string;
  pqcSignature: string;
  status: 'confirmed' | 'pending' | 'failed';
  serviceName: string;
  x402ProofToken: string;
}

export interface AgentTaskStep {
  stepNumber: number;
  title: string;
  state: AgentStateId;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'waiting-approval';
  serviceRequired?: PaidService;
  costUsdc?: number;
  txId?: string;
  details?: string;
  resultPayload?: any;
  timestamp?: string;
}

export interface AgentExecutionPlan {
  goalId: string;
  userGoal: string;
  parsedIntent: string;
  steps: AgentTaskStep[];
  totalEstimatedCostUsdc: number;
  totalActualCostUsdc: number;
  startTime: string;
  completedTime?: string;
  status: 'idle' | 'planning' | 'optimizing' | 'awaiting-approval' | 'executing' | 'completed' | 'failed';
  finalSummary?: string;
  conwayEntropyDelta?: number;
}

export interface GovernancePolicy {
  maxPerRequestUsdc: number;
  maxPerTaskUsdc: number;
  dailyBudgetUsdc: number;
  dailySpentUsdc: number;
  maxRiskThreshold: number; // 0 to 1.0
  pqcMinimumScore: number; // 0 to 1.0
  requireHumanApprovalAboveUsdc: number;
  requireHumanApprovalAboveRisk: number;
  allowedAssets: PaymentAsset[];
  circuitBreakerActive: boolean;
}

export interface PqcKeyPair {
  keyId: string;
  algorithm: 'ML-KEM-768' | 'ML-DSA-65' | 'Hybrid-Ed25519-Dilithium';
  publicKey: string;
  publicKeyFingerprint: string;
  privateKeyPreview: string;
  keySizeBits: number;
  nistSecurityLevel: number;
  createdAt: string;
  authorizedForAgent: boolean;
}

export interface WalletState {
  address: string;
  mnemonicSeedPreview: string;
  algoBalance: number;
  usdcBalance: number;
  network: NetworkMode;
  pqcKeyId: string;
}
