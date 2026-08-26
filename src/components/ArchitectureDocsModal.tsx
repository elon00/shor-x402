import React from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  ArrowRight,
  Activity,
  BookOpen,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                SHOR x402 — Complete Architecture & Mathematical Specification
              </h2>
              <p className="text-xs text-slate-400">
                Post-Quantum Autonomous Agent Commerce on Algorand
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-800">
          {/* Section 1: Project Identity & Vision */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              1. Project Identity & Purpose
            </h3>
            <p>
              <strong className="text-slate-100">Tagline:</strong> AI agents that discover, pay, execute, and verify digital services autonomously.
            </p>
            <p>
              <strong className="text-slate-100">One-Line Vision:</strong> A post-quantum Web 4.0 agent economy powered by x402 payments and Algorand settlement.
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 text-center">
              Human &rarr; Natural-Language Goal &rarr; SHOR AI Agent &rarr; Plan &rarr; Discover Paid Service &rarr; Risk/Budget Check &rarr; x402 HTTP 402 &rarr; Algorand Settlement &rarr; Execution &rarr; PQC Verification &rarr; Synthesized AI Result
            </div>
          </div>

          {/* Section 2: What is Synchronized vs Cut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-emerald-500/30 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Retained Core Components
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li>&bull; <strong className="text-white">Aether AI & Multi-Model Router:</strong> Decomposes complex user goals into verifiable subtasks.</li>
                <li>&bull; <strong className="text-white">Conway Automaton Engine:</strong> Formal state machine from $S_0$ (Idle) to $S_{10}$ (Complete).</li>
                <li>&bull; <strong className="text-white">QUBO / QAOA Optimizer:</strong> Mathematically selects services to minimize cost, latency & risk.</li>
                <li>&bull; <strong className="text-white">Post-Quantum Cryptography:</strong> NIST FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65).</li>
                <li>&bull; <strong className="text-white">x402 + Algorand USDC:</strong> Native micro-payments with instant finality.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-rose-500/30 space-y-2">
              <h4 className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Excluded Speculative Fluff
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li>&bull; <strong className="text-rose-300">No $PQC Token:</strong> x402 utilizes standard stablecoins (USDC) and native ALGO.</li>
                <li>&bull; <strong className="text-rose-300">No Unneeded NFTs:</strong> Eliminated non-functional token mechanics.</li>
                <li>&bull; <strong className="text-rose-300">No Multichain Bridge:</strong> Eliminates cross-chain smart contract risk surface.</li>
                <li>&bull; <strong className="text-rose-300">No Unverified Claims:</strong> Honest benchmarking grounded in real execution.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Optimization Equation */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-indigo-300 font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              2. SHOR Agent Optimization Equation
            </h3>
            <p className="text-xs text-slate-300">
              For n candidate services where x_i ∈ {"{0, 1}"}, the agent solves:
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-indigo-500/30 text-center font-mono text-xs text-indigo-200 font-bold">
              H(x) = α·C(x) + β·L(x) + γ·R(x) + δ·Q(x) + λ·P(x)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div><strong className="text-cyan-300">C(x):</strong> Payment Cost</div>
              <div><strong className="text-indigo-300">L(x):</strong> Latency</div>
              <div><strong className="text-amber-300">R(x):</strong> Risk Index</div>
              <div><strong className="text-emerald-300">Q(x):</strong> Quantum Exposure</div>
              <div><strong className="text-rose-300">P(x):</strong> Policy Penalties</div>
            </div>
          </div>

          {/* Section 4: Conway Automaton States */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-emerald-300 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              3. Conway Automaton State Pipeline
            </h3>
            <p className="text-xs text-slate-300">
              Transition function: <span className="font-mono text-cyan-300 font-semibold">S_(t+1) = F(S_t, N_t, P_t)</span> across states $S_0$ to $S_{10}$:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-300 pt-1">
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S0: IDLE (Standby)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S1: OBSERVE (Context Scan)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S2: PLAN (Task Decomposition)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S3: DISCOVER (Service Registry)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S4: EVALUATE (QUBO Solver)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S5: AUTHORIZE (Policy Gate)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S6: PAY (x402 Settlement)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S7: EXECUTE (Payload Request)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S8: VERIFY (PQC Attestation)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S9: RECOVER (Fault Retry)</div>
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800">S10: COMPLETE (Synthesis)</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shadow"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
