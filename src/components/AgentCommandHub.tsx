import React, { useState } from 'react';
import {
  Send,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Coins,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Terminal,
  Activity,
  FileCode,
  Layers,
} from 'lucide-react';
import {
  AgentExecutionPlan,
  AgentStateId,
  PaidService,
  WalletState,
  GovernancePolicy,
  QuboWeights,
  AlgorandTransaction,
  PqcKeyPair,
} from '../types';
import { AGENT_STATE_CATALOG } from '../data/serviceRegistry';

interface AgentCommandHubProps {
  currentPlan: AgentExecutionPlan | null;
  isRunning: boolean;
  agentState: AgentStateId;
  logs: { time: string; state: AgentStateId; message: string; type?: 'info' | 'warn' | 'success' | 'algo' }[];
  onStartExecution: (userGoal: string) => void;
  wallet: WalletState;
  policy: GovernancePolicy;
  weights: QuboWeights;
  services: PaidService[];
  pendingApproval: { stepTitle: string; costUsdc: number; risk: number } | null;
  onApproveStep: (approved: boolean) => void;
  onSelectTx: (txId: string) => void;
}

export const AgentCommandHub: React.FC<AgentCommandHubProps> = ({
  currentPlan,
  isRunning,
  agentState,
  logs,
  onStartExecution,
  wallet,
  policy,
  pendingApproval,
  onApproveStep,
  onSelectTx,
}) => {
  const [goalInput, setGoalInput] = useState('');

  const PRESETS = [
    {
      label: 'Planetary Weather Radar',
      query: 'Query live atmospheric radar and micro-climate forecasting feeds within 0.01 USDC budget',
      cost: '$0.002 USDC',
    },
    {
      label: 'Quantum Neural Inference',
      query: 'Execute parameterized tensor contraction and optimal spin-state evaluation via quantum inference',
      cost: '$0.015 USDC',
    },
    {
      label: 'Orbital HPC Compute',
      query: 'Run distributed orbital satellite lidar matrix decomposition and interferometry analysis',
      cost: '$0.050 USDC',
    },
    {
      label: 'Sub-Second Macro Alpha',
      query: 'Extract real-time orderbook delta, DEX liquidity depth, and cross-chain volatility smile',
      cost: '$0.008 USDC',
    },
    {
      label: 'Quantum Entropy Stream',
      query: 'Request hardware photon-beam shot-noise continuous quantum entropy seed with ML-KEM-768 proof',
      cost: '$0.001 USDC',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isRunning) return;
    onStartExecution(goalInput.trim());
  };

  const currentStateMeta = AGENT_STATE_CATALOG.find((s) => s.id === agentState) || AGENT_STATE_CATALOG[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & State Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRunning ? 'bg-cyan-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isRunning ? 'bg-cyan-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                SHOR Autonomous Economic Agent (SHOR-AE)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-mono">
                {currentStateMeta.code}: {currentStateMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              {currentStateMeta.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 px-3">
            <div>
              <span className="text-slate-500 block text-[10px]">DAILY SPENT</span>
              <span className="text-slate-200 font-bold">${policy.dailySpentUsdc.toFixed(4)} / ${policy.dailyBudgetUsdc}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">RISK CAP</span>
              <span className="text-emerald-400 font-bold">{(policy.maxRiskThreshold * 100).toFixed(0)}%</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">SETTLEMENT</span>
              <span className="text-cyan-400 font-bold">Algorand USDC</span>
            </div>
          </div>
        </div>

        {/* Goal Input Field */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Give SHOR Agent a natural-language goal (e.g. 'Gather live planetary radar & run quantum modeling')..."
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-all font-sans"
            />
            {goalInput && (
              <button
                type="button"
                onClick={() => setGoalInput('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isRunning || !goalInput.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Goal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Presets */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-500 whitespace-nowrap">Examples:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setGoalInput(p.query);
                if (!isRunning) onStartExecution(p.query);
              }}
              disabled={isRunning}
              className="text-xs px-2.5 py-1 rounded bg-slate-950/80 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span>{p.label}</span>
              <span className="text-[10px] text-cyan-400/80 font-mono">({p.cost})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Human In The Loop Approval Modal */}
      {pendingApproval && (
        <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-xl p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
                  Policy Governance: Human Approval Required
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Trigger: Cost / Risk Threshold
                </span>
              </div>
              <p className="text-xs text-amber-100/90">
                Agent is preparing to execute step: <strong className="text-white font-mono">{pendingApproval.stepTitle}</strong>.
                Required settlement is <strong className="text-cyan-300">${pendingApproval.costUsdc.toFixed(4)} USDC</strong> with risk index <strong className="text-amber-300">{(pendingApproval.risk * 100).toFixed(0)}%</strong>.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onApproveStep(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve x402 Payment & Continue
                </button>
                <button
                  onClick={() => onApproveStep(false)}
                  className="px-4 py-2 bg-rose-950 border border-rose-700/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Reject & Abort Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Execution Plan & Live Thought Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Decomposition & Execution Steps */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Autonomous Execution Graph
                </h3>
              </div>
              {currentPlan && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Estimated:</span>
                  <span className="text-cyan-300 font-bold">${currentPlan.totalEstimatedCostUsdc.toFixed(4)} USDC</span>
                </div>
              )}
            </div>

            {currentPlan ? (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-mono">GOAL PARSED</span>
                  <p className="text-xs text-slate-200 mt-0.5">{currentPlan.parsedIntent}</p>
                </div>

                <div className="space-y-2.5">
                  {currentPlan.steps.map((step) => {
                    const isPending = step.status === 'pending';
                    const isInProgress = step.status === 'in-progress';
                    const isCompleted = step.status === 'completed';
                    const isWaiting = step.status === 'waiting-approval';

                    return (
                      <div
                        key={step.stepNumber}
                        className={`p-3 rounded-lg border transition-all ${
                          isInProgress
                            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                            : isCompleted
                            ? 'bg-slate-950/60 border-slate-800/80'
                            : isWaiting
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : 'bg-slate-950/30 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              {isInProgress && (
                                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                              )}
                              {isWaiting && <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />}
                              {isPending && <Clock className="w-4 h-4 text-slate-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  Step {step.stepNumber}: {step.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  {step.state}
                                </span>
                              </div>
                              {step.details && (
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.details}</p>
                              )}
                              {step.serviceRequired && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                                  <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                    Service: {step.serviceRequired.name}
                                  </span>
                                  <span className="text-slate-300">
                                    Cost: ${step.serviceRequired.costUsdc.toFixed(4)} USDC
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {step.txId && (
                            <button
                              onClick={() => onSelectTx(step.txId!)}
                              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/30 whitespace-nowrap transition-colors"
                            >
                              Tx: {step.txId.substring(0, 10)}...
                            </button>
                          )}
                        </div>

                        {/* Verified Result Payload Preview */}
                        {step.resultPayload && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1">
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                200 OK — Verified x402 Delivery
                              </span>
                              <span className="text-slate-500">PQC Certified</span>
                            </div>
                            <pre className="text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-32 scrollbar-none">
                              {JSON.stringify(step.resultPayload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Synthesized AI Summary Card */}
                {currentPlan.status === 'completed' && currentPlan.finalSummary && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-emerald-950/30 border border-indigo-500/30 shadow-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-indigo-200 tracking-wide uppercase">
                          Synthesized Intelligence Output
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Cryptographically Settled</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {currentPlan.finalSummary}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/60">
                      <span>Total Settled: <strong className="text-cyan-300">${currentPlan.totalActualCostUsdc.toFixed(4)} USDC</strong></span>
                      <span>Execution Status: <strong className="text-emerald-400">100% Verified</strong></span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Terminal className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No active autonomous plan. Enter a goal above to initialize the SHOR-AE execution pipeline.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Agent Thoughts & Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Autonomous State & Thought Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                Live Telemetry
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Awaiting agent telemetry...
                </div>
              ) : (
                logs.map((log, idx) => {
                  let badgeColor = 'bg-slate-800 text-slate-400';
                  if (log.type === 'algo') badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
                  if (log.type === 'success') badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                  if (log.type === 'warn') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';

                  return (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950/70 border border-slate-850 hover:border-slate-700 transition-colors text-[11px] leading-relaxed"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="text-slate-400">{log.time}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] ${badgeColor}`}>
                          {log.state}
                        </span>
                      </div>
                      <p className="text-slate-200 font-sans">{log.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Quick State Gauge */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active State: <strong className="text-cyan-300">{currentStateMeta.code}</strong></span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PQC Shield Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
