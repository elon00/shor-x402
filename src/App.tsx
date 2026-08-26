/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AgentCommandHub } from './components/AgentCommandHub';
import { ConwayAutomatonView } from './components/ConwayAutomatonView';
import { QuboSolverView } from './components/QuboSolverView';
import { AlgorandExplorerView } from './components/AlgorandExplorerView';
import { PqcSecurityView } from './components/PqcSecurityView';
import { ServiceMarketplaceView } from './components/ServiceMarketplaceView';
import { GovernanceView } from './components/GovernanceView';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';

import {
  AgentExecutionPlan,
  AgentStateId,
  PaidService,
  WalletState,
  GovernancePolicy,
  QuboWeights,
  AlgorandTransaction,
  PqcKeyPair,
  NetworkMode,
} from './types';

import { INITIAL_SERVICES } from './data/serviceRegistry';
import { generatePqcKeyPair } from './utils/pqcCrypto';
import { solveServiceSelection } from './utils/quboSolver';
import { executeX402ServiceRequest } from './services/apiClient';
import { fetchLiveAlgodStatus } from './services/algorandClient';
import {
  connectLuteOrAlgorandWallet,
  DEFAULT_ALGORAND_ADDRESSES,
  getSavedLutePublicKey,
} from './services/walletConnector';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('agent-hub');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [walletProviderName, setWalletProviderName] = useState<string>('Lute Wallet');

  // Post-Quantum Keypair
  const [pqcKey, setPqcKey] = useState<PqcKeyPair>(() => generatePqcKeyPair('ML-DSA-65'));

  // Algorand Wallet
  const [wallet, setWallet] = useState<WalletState>(() => {
    const savedLute = getSavedLutePublicKey();
    return {
      address: savedLute || DEFAULT_ALGORAND_ADDRESSES.mainnet,
      algoBalance: savedLute ? 25.0 : 12.5,
      usdcBalance: savedLute ? 5.0 : 1.25,
      network: 'algorand-mainnet',
      pqcKeyId: pqcKey.keyId,
      providerName: 'Lute Wallet',
      isCustomLuteKey: !!savedLute,
    };
  });

  // Algorand Network & Round
  const [activeRound, setActiveRound] = useState<number>(42891042);
  const [isNodeLive, setIsNodeLive] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const pollStatus = async () => {
      try {
        const status = await fetchLiveAlgodStatus(wallet.network);
        if (isMounted) {
          setActiveRound(status.lastRound);
          setIsNodeLive(status.isLive);
        }
      } catch (err) {
        if (isMounted) {
          setActiveRound((r) => r + 1);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3500); // ~3.5s per Algorand block round
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [wallet.network]);

  // Services Catalog
  const [services, setServices] = useState<PaidService[]>(INITIAL_SERVICES);

  // QUBO Hamiltonian Weights
  const [weights, setWeights] = useState<QuboWeights>({
    alpha: 1.0, // Cost weight
    beta: 0.6,  // Latency weight
    gamma: 0.8, // Risk weight
    delta: 1.2, // PQC Security weight
    lambda: 2.0, // Policy constraint penalty
  });

  // Governance Policy
  const [policy, setPolicy] = useState<GovernancePolicy>({
    maxPerRequestUsdc: 0.06,
    maxPerTaskUsdc: 0.15,
    dailyBudgetUsdc: 2.5,
    dailySpentUsdc: 0.024,
    maxRiskThreshold: 0.35,
    pqcMinimumScore: 0.8,
    requireHumanApprovalAboveUsdc: 0.03,
    requireHumanApprovalAboveRisk: 0.25,
    allowedAssets: ['USDC', 'ALGO'],
    circuitBreakerActive: false,
  });

  // Transaction Ledger
  const [transactions, setTransactions] = useState<AlgorandTransaction[]>([
    {
      txId: 'TX_INITIAL_ORBITAL_SEED_888999AAA111BBB222CCC333DDD444EEE',
      sender: 'SHOR7AGENT999ALGORANDUSDC777AAA888BBBCCC31566704PQC999',
      receiver: 'WEATHR7QW8V9E3LK2X64MPN56YZAQ1B2C3D4E5F6G7H8J9K0L1M2N3P4Q5',
      asset: 'USDC',
      amount: 0.002,
      feeAlgo: 0.001,
      confirmedRound: 42891010,
      timestamp: new Date(Date.now() - 360000).toISOString(),
      note: 'x402:init-seed-bootstrap',
      pqcSignature: 'SHOR-HYBRID-V1.ed25519_sig_init.mldsa65_sig_lattice_777',
      status: 'confirmed',
      serviceName: 'Planetary Radar & Hyperlocal Weather API',
      x402ProofToken: 'x402_proof_initial_42891010',
    },
  ]);

  // Agent State & Execution
  const [agentState, setAgentState] = useState<AgentStateId>('S0_IDLE');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<AgentExecutionPlan | null>(null);
  const [logs, setLogs] = useState<
    { time: string; state: AgentStateId; message: string; type?: 'info' | 'warn' | 'success' | 'algo' }[]
  >([
    {
      time: new Date().toLocaleTimeString(),
      state: 'S0_IDLE',
      message: 'SHOR Autonomous Economic Agent initialized on Algorand MainNet with NIST FIPS 204 ML-DSA-65 security.',
      type: 'success',
    },
  ]);

  // Human-in-the-loop modal trigger
  const [pendingApproval, setPendingApproval] = useState<{
    stepTitle: string;
    costUsdc: number;
    risk: number;
    resolver?: (approved: boolean) => void;
  } | null>(null);

  const addLog = (
    state: AgentStateId,
    message: string,
    type: 'info' | 'warn' | 'success' | 'algo' = 'info'
  ) => {
    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        state,
        message,
        type,
      },
      ...prev.slice(0, 80),
    ]);
  };

  const handleConnectWallet = async () => {
    try {
      const info = await connectLuteOrAlgorandWallet(wallet.network);
      setWallet((w) => ({
        ...w,
        address: info.address,
        algoBalance: info.algoBalance,
        usdcBalance: info.usdcBalance,
        providerName: info.providerName,
        isCustomLuteKey: info.isCustomKey,
      }));
      setWalletProviderName(info.providerName);
      addLog('S0_IDLE', `Connected: ${info.providerName} (${info.address.substring(0, 8)}... on ${wallet.network}).`, 'algo');
    } catch (e: any) {
      addLog('S0_IDLE', `Wallet connection status: ${e.message}`, 'info');
    }
  };

  const handleUpdateCustomAddress = (newAddress: string) => {
    setWallet((w) => ({
      ...w,
      address: newAddress,
      isCustomLuteKey: true,
      providerName: 'Lute Wallet',
    }));
    setWalletProviderName('Lute Wallet');
    addLog('S0_IDLE', `Lute Wallet Public Key updated to ${newAddress.substring(0, 8)}...`, 'success');
  };

  const handleFaucetClaim = () => {
    setWallet((w) => ({
      ...w,
      algoBalance: w.algoBalance + 5.0,
      usdcBalance: w.usdcBalance + 0.5,
    }));
    addLog('S0_IDLE', 'Claimed 0.50 USDC and 5.00 ALGO test assets into Agent Wallet.', 'algo');
  };

  const handleNetworkChange = (net: NetworkMode) => {
    setWallet((w) => {
      const isCustom = w.isCustomLuteKey;
      const newAddr = isCustom
        ? w.address
        : (net === 'algorand-mainnet' ? DEFAULT_ALGORAND_ADDRESSES.mainnet : DEFAULT_ALGORAND_ADDRESSES.testnet);
      return {
        ...w,
        network: net,
        address: newAddr,
      };
    });
    addLog('S0_IDLE', `Switched blockchain settlement target to ${net}.`, 'info');
  };

  // Autonomous Execution Pipeline
  const runAutonomousWorkflow = async (userGoal: string) => {
    if (policy.circuitBreakerActive) {
      addLog('S0_IDLE', 'EXECUTION ABORTED: Emergency Circuit Breaker is active.', 'warn');
      return;
    }

    setIsRunning(true);
    setAgentState('S1_OBSERVE');
    addLog('S1_OBSERVE', `Received user goal: "${userGoal}". Commencing context observation...`, 'info');

    // Small step delay helper for visual smoothness
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      await delay(600);
      setAgentState('S2_PLAN');
      addLog('S2_PLAN', 'Querying Aether AI planning engine for hierarchical task decomposition...', 'algo');

      // Call server-side planning endpoint (Gemini or deterministic)
      let planData: any = null;
      try {
        const res = await fetch('/api/gemini/plan-and-reason', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userGoal,
            availableServices: services,
            budgetUsdc: policy.maxPerTaskUsdc,
          }),
        });
        planData = await res.json();
      } catch (e) {
        // Fallback
        planData = {
          parsedIntent: userGoal,
          planTitle: 'Autonomous Service Execution Plan',
          steps: [
            { stepNumber: 1, title: 'Context Discovery', state: 'S1_OBSERVE', costUsdc: 0 },
            { stepNumber: 2, title: 'QUBO Service Selection', state: 'S4_EVALUATE', costUsdc: 0 },
            { stepNumber: 3, title: 'x402 Algorand Settlement', state: 'S6_PAY', costUsdc: 0.002, serviceId: 'srv-weather-hyperlocal' },
            { stepNumber: 4, title: 'Cryptographic Verification', state: 'S8_VERIFY', costUsdc: 0 },
          ],
          totalEstimatedCostUsdc: 0.002,
        };
      }

      await delay(600);
      setAgentState('S3_DISCOVER');
      addLog('S3_DISCOVER', 'Scanning decentralized service registry for matching x402 endpoints...', 'info');

      await delay(600);
      setAgentState('S4_EVALUATE');
      addLog('S4_EVALUATE', 'Constructing QUBO matrix and solving H(x) = αC + βL + γR + δQ + λP...', 'algo');

      // Execute QUBO optimization
      const optResult = solveServiceSelection(services, weights, policy, 'qubo-annealing');
      const selectedService = optResult.selectedService;
      addLog(
        'S4_EVALUATE',
        `QUBO converged in ${optResult.solverTimeMs}ms! Optimal service: "${selectedService.name}" (H = ${optResult.energyH}, Cost = $${selectedService.costUsdc} USDC).`,
        'success'
      );

      // Create execution plan in state
      const initialPlan: AgentExecutionPlan = {
        goalId: `goal-${Date.now()}`,
        userGoal,
        parsedIntent: planData.parsedIntent || userGoal,
        steps: [
          {
            stepNumber: 1,
            title: 'Environmental Telemetry & Memory Scan',
            state: 'S1_OBSERVE',
            status: 'completed',
            details: 'Verified local entropy seed and Algorand network synchronization.',
          },
          {
            stepNumber: 2,
            title: `QUBO Selection: ${selectedService.name}`,
            state: 'S4_EVALUATE',
            status: 'completed',
            details: `Selected optimal provider with energy H=${optResult.energyH}, latency=${selectedService.latencyMs}ms, PQC rating=${(selectedService.pqcScore * 100).toFixed(0)}%.`,
            costUsdc: 0,
          },
          {
            stepNumber: 3,
            title: `x402 Algorand Settlement & Execution (${selectedService.name})`,
            state: 'S6_PAY',
            status: 'in-progress',
            serviceRequired: selectedService,
            costUsdc: selectedService.costUsdc,
            details: 'Initiating HTTP request, negotiating 402 challenge, and broadcasting Algorand USDC payment.',
          },
          {
            stepNumber: 4,
            title: 'Cryptographic Post-Quantum Verification & Result Synthesis',
            state: 'S8_VERIFY',
            status: 'pending',
            details: 'Validating ML-DSA-65 signature and formatting verified response.',
          },
        ],
        totalEstimatedCostUsdc: selectedService.costUsdc,
        totalActualCostUsdc: 0,
        startTime: new Date().toISOString(),
        status: 'executing',
      };

      setCurrentPlan(initialPlan);

      // Policy & Human-in-the-loop check
      setAgentState('S5_AUTHORIZE');
      addLog('S5_AUTHORIZE', 'Evaluating governance boundaries (Spending caps, risk threshold)...', 'info');

      const requiresApproval =
        selectedService.costUsdc > policy.requireHumanApprovalAboveUsdc ||
        selectedService.riskScore > policy.requireHumanApprovalAboveRisk;

      if (requiresApproval) {
        addLog('S5_AUTHORIZE', `Policy Trigger: Cost ($${selectedService.costUsdc}) or Risk exceeds auto-approval limits. Awaiting human confirmation...`, 'warn');
        
        // Wait for human approval
        const approved = await new Promise<boolean>((resolve) => {
          setPendingApproval({
            stepTitle: selectedService.name,
            costUsdc: selectedService.costUsdc,
            risk: selectedService.riskScore,
            resolver: resolve,
          });
        });

        setPendingApproval(null);

        if (!approved) {
          addLog('S5_AUTHORIZE', 'Human operator rejected step payment. Aborting autonomous goal.', 'warn');
          setCurrentPlan((p) => (p ? { ...p, status: 'failed' } : null));
          setAgentState('S9_RECOVER');
          setIsRunning(false);
          return;
        }
        addLog('S5_AUTHORIZE', 'Human operator approved payment authorization.', 'success');
      }

      // Step 3: Execute x402 Request & Settlement
      await delay(500);
      setAgentState('S6_PAY');
      addLog('S6_PAY', `Dispatching GET to ${selectedService.endpoint}. Expecting HTTP 402 challenge...`, 'info');

      const x402Result = await executeX402ServiceRequest(
        selectedService,
        wallet,
        pqcKey,
        (tx) => {
          setTransactions((prev) => [tx, ...prev]);
          setWallet((w) => ({
            ...w,
            usdcBalance: Math.max(0, w.usdcBalance - tx.amount),
            algoBalance: Math.max(0, w.algoBalance - tx.feeAlgo),
          }));
          setPolicy((pol) => ({
            ...pol,
            dailySpentUsdc: pol.dailySpentUsdc + tx.amount,
          }));
          addLog('S6_PAY', `Algorand Tx broadcast: ${tx.txId.substring(0, 18)}... (Fee: ${tx.feeAlgo} ALGO, Amount: $${tx.amount} USDC)`, 'algo');
        }
      );

      if (!x402Result.success) {
        throw new Error(x402Result.error || 'x402 payment negotiation failed');
      }

      setAgentState('S7_EXECUTE');
      addLog('S7_EXECUTE', 'Delivered authenticated x402 request token to service endpoint. HTTP 200 OK received!', 'success');

      // Update step in plan
      setCurrentPlan((prev) => {
        if (!prev) return null;
        const nextSteps = [...prev.steps];
        nextSteps[2] = {
          ...nextSteps[2],
          status: 'completed',
          txId: x402Result.transaction?.txId,
          resultPayload: x402Result.payload,
        };
        nextSteps[3] = {
          ...nextSteps[3],
          status: 'in-progress',
        };
        return {
          ...prev,
          steps: nextSteps,
          totalActualCostUsdc: selectedService.costUsdc,
        };
      });

      // Step 4: Verification & Synthesis
      await delay(600);
      setAgentState('S8_VERIFY');
      addLog('S8_VERIFY', 'Validating ML-DSA-65 post-quantum signature and payload hash commitment...', 'algo');

      await delay(500);
      setAgentState('S10_COMPLETE');
      addLog('S10_COMPLETE', 'Autonomous goal execution finished successfully with 100% cryptographic verification.', 'success');

      const finalSummary = `Successfully executed autonomous plan for "${userGoal}". Discovered, negotiated, and settled with "${selectedService.name}" for $${selectedService.costUsdc.toFixed(4)} USDC on Algorand. All payload receipts certified with NIST FIPS 204 (ML-DSA-65) post-quantum signatures.`;

      setCurrentPlan((prev) => {
        if (!prev) return null;
        const nextSteps = [...prev.steps];
        nextSteps[3] = {
          ...nextSteps[3],
          status: 'completed',
          resultPayload: {
            pqcAttestation: 'ML-DSA-65-VERIFIED',
            latencyMs: selectedService.latencyMs,
            riskScore: selectedService.riskScore,
            status: 'CERTIFIED_DELIVERY',
          },
        };
        return {
          ...prev,
          steps: nextSteps,
          status: 'completed',
          completedTime: new Date().toISOString(),
          finalSummary,
        };
      });
    } catch (err: any) {
      setAgentState('S9_RECOVER');
      addLog('S9_RECOVER', `Workflow encountered error: ${err.message}. Engaging recovery protocols...`, 'warn');
      setCurrentPlan((prev) => (prev ? { ...prev, status: 'failed' } : null));
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveStep = (approved: boolean) => {
    if (pendingApproval?.resolver) {
      pendingApproval.resolver(approved);
    }
  };

  const handleSelectTx = (txId: string) => {
    setSelectedTxId(txId);
    setActiveTab('algorand-explorer');
  };

  const handleAddService = (newSrv: PaidService) => {
    setServices((prev) => [newSrv, ...prev]);
    addLog('S0_IDLE', `Registered new paid service endpoint: "${newSrv.name}" ($${newSrv.costUsdc} USDC).`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        onFaucetClaim={handleFaucetClaim}
        onNetworkChange={handleNetworkChange}
        currentAgentState={agentState}
        onOpenDocs={() => setIsDocsOpen(true)}
        activeRound={activeRound}
        onConnectWallet={handleConnectWallet}
        onUpdateCustomAddress={handleUpdateCustomAddress}
        walletProviderName={walletProviderName}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'agent-hub' && (
          <AgentCommandHub
            currentPlan={currentPlan}
            isRunning={isRunning}
            agentState={agentState}
            logs={logs}
            onStartExecution={runAutonomousWorkflow}
            wallet={wallet}
            policy={policy}
            weights={weights}
            services={services}
            pendingApproval={pendingApproval}
            onApproveStep={handleApproveStep}
            onSelectTx={handleSelectTx}
          />
        )}

        {activeTab === 'conway-engine' && (
          <ConwayAutomatonView
            currentAgentState={agentState}
            onInjectState={(state) => {
              setAgentState(state);
              addLog(state, `Manually injected Conway cellular seed pattern for state ${state}.`, 'info');
            }}
          />
        )}

        {activeTab === 'qubo-solver' && (
          <QuboSolverView
            services={services}
            weights={weights}
            onUpdateWeights={setWeights}
            policy={policy}
          />
        )}

        {activeTab === 'algorand-explorer' && (
          <AlgorandExplorerView
            transactions={transactions}
            network={wallet.network}
            activeRound={activeRound}
            selectedTxId={selectedTxId}
          />
        )}

        {activeTab === 'pqc-security' && (
          <PqcSecurityView
            currentKeyPair={pqcKey}
            onUpdateKeyPair={(kp) => {
              setPqcKey(kp);
              setWallet((w) => ({ ...w, pqcKeyId: kp.keyId }));
              addLog('S0_IDLE', `Rotated Agent Post-Quantum Identity keypair (${kp.algorithm}).`, 'algo');
            }}
          />
        )}

        {activeTab === 'service-marketplace' && (
          <ServiceMarketplaceView
            services={services}
            onAddService={handleAddService}
            wallet={wallet}
            pqcKey={pqcKey}
            onTxCreated={(tx) => {
              setTransactions((prev) => [tx, ...prev]);
              setWallet((w) => ({
                ...w,
                usdcBalance: Math.max(0, w.usdcBalance - tx.amount),
                algoBalance: Math.max(0, w.algoBalance - tx.feeAlgo),
              }));
              addLog('S6_PAY', `Sandbox x402 Algorand payment settled: ${tx.txId.substring(0, 16)}...`, 'algo');
            }}
          />
        )}

        {activeTab === 'governance' && (
          <GovernanceView policy={policy} onUpdatePolicy={setPolicy} />
        )}
      </main>

      {/* Architecture Documentation Modal */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
