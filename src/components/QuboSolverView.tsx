import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Sliders,
  Zap,
  TrendingDown,
  Layers,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Table,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { PaidService, QuboWeights, GovernancePolicy } from '../types';
import {
  solveServiceSelection,
  buildQuboMatrix,
  calculateServiceEnergy,
} from '../utils/quboSolver';

interface QuboSolverViewProps {
  services: PaidService[];
  weights: QuboWeights;
  onUpdateWeights: (newWeights: QuboWeights) => void;
  policy: GovernancePolicy;
}

export const QuboSolverView: React.FC<QuboSolverViewProps> = ({
  services,
  weights,
  onUpdateWeights,
  policy,
}) => {
  const [activeSolver, setActiveSolver] = useState<'qubo-annealing' | 'classical-greedy' | 'qaoa-quantum'>('qubo-annealing');

  // Compute optimization result dynamically
  const result = useMemo(() => {
    return solveServiceSelection(services, weights, policy, activeSolver);
  }, [services, weights, policy, activeSolver]);

  const matrixQ = useMemo(() => {
    return buildQuboMatrix(services, weights, policy);
  }, [services, weights, policy]);

  // Chart data
  const chartData = useMemo(() => {
    return services.map((s) => {
      const breakdown = calculateServiceEnergy(s, weights, policy);
      return {
        name: s.name.length > 20 ? s.name.substring(0, 18) + '...' : s.name,
        fullName: s.name,
        serviceId: s.id,
        energy: breakdown.energy,
        costComp: breakdown.costComp,
        latencyComp: breakdown.latencyComp,
        riskComp: breakdown.riskComp,
        pqcComp: breakdown.pqcComp,
        penaltyComp: breakdown.penaltyComp,
        rawCost: s.costUsdc,
        rawLatency: s.latencyMs,
        isSelected: s.id === result.selectedServiceId,
      };
    });
  }, [services, weights, policy, result.selectedServiceId]);

  return (
    <div className="space-y-6">
      {/* Equation Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                SHOR Agent Optimization Equation
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Before paying for external digital services, the agent solves the Quadratic Unconstrained Binary Optimization (QUBO) problem to minimize cost, latency, and risk while maximizing post-quantum cryptographic security.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-indigo-900/50 shadow-inner">
            <div className="text-center font-mono text-xs text-indigo-300 font-bold tracking-wide">
              H(x) = α·C(x) + β·L(x) + γ·R(x) + δ·Q(x) + λ·P(x)
            </div>
            <div className="text-[10px] text-slate-400 text-center mt-1">
              Objective: <strong className="text-emerald-400">min H(x)</strong> across x ∈ {'{0, 1}'}ⁿ
            </div>
          </div>
        </div>
      </div>

      {/* Solver Selectors & Weight Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Weight Sliders & Solver Engine Switcher */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Hamiltonian Parameters
              </h3>
              <button
                onClick={() => onUpdateWeights({ alpha: 1.0, beta: 0.6, gamma: 0.8, delta: 1.2, lambda: 2.0 })}
                className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono transition-colors"
              >
                Reset Defaults
              </button>
            </div>

            {/* Slider 1: α Cost */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">α (Cost Weight C):</span>
                <span className="text-cyan-400 font-bold">{weights.alpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={weights.alpha}
                onChange={(e) => onUpdateWeights({ ...weights, alpha: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
              <p className="text-[10px] text-slate-500">Penalizes higher payment costs in USDC/ALGO.</p>
            </div>

            {/* Slider 2: β Latency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">β (Latency Weight L):</span>
                <span className="text-indigo-400 font-bold">{weights.beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={weights.beta}
                onChange={(e) => onUpdateWeights({ ...weights, beta: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400"
              />
              <p className="text-[10px] text-slate-500">Prioritizes low-latency response times.</p>
            </div>

            {/* Slider 3: γ Risk */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">γ (Risk Weight R):</span>
                <span className="text-amber-400 font-bold">{weights.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={weights.gamma}
                onChange={(e) => onUpdateWeights({ ...weights, gamma: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
              <p className="text-[10px] text-slate-500">Avoids unverified or high-volatility providers.</p>
            </div>

            {/* Slider 4: δ PQC/Security */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">δ (Security/PQC Weight Q):</span>
                <span className="text-emerald-400 font-bold">{weights.delta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={weights.delta}
                onChange={(e) => onUpdateWeights({ ...weights, delta: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400"
              />
              <p className="text-[10px] text-slate-500">Heavily penalizes services lacking ML-DSA-65 or ML-KEM-768.</p>
            </div>

            {/* Slider 5: λ Policy Penalty */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">λ (Policy Constraint Penalty P):</span>
                <span className="text-rose-400 font-bold">{weights.lambda.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={weights.lambda}
                onChange={(e) => onUpdateWeights({ ...weights, lambda: parseFloat(e.target.value) })}
                className="w-full accent-rose-400"
              />
              <p className="text-[10px] text-slate-500">Enforces hard spending limits and single-service selection.</p>
            </div>

            {/* Solver Architecture Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-mono block">ACTIVE SOLVER ENGINE:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'qubo-annealing', label: 'QUBO Annealer', sub: 'Simulated Annealing' },
                  { id: 'qaoa-quantum', label: 'QAOA Quantum', sub: 'Variational Ansatz' },
                  { id: 'classical-greedy', label: 'Classical Greedy', sub: 'Exhaustive Min' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSolver(s.id as any)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      activeSolver === s.id
                        ? 'bg-indigo-950/60 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{s.label}</div>
                    <div className="text-[9px] text-slate-500">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Optimization Results & Energy Landscape Chart */}
        <div className="lg:col-span-7 space-y-4">
          {/* Winner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block">
                  OPTIMAL GLOBAL GROUND STATE
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{result.selectedService.name}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
                  H(x) = {result.energyH}
                </span>
                <span className="px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {result.solverTimeMs}ms
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs font-mono">
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">COST</span>
                <span className="text-cyan-300 font-bold">${result.selectedService.costUsdc.toFixed(4)} USDC</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">LATENCY</span>
                <span className="text-indigo-300 font-bold">{result.selectedService.latencyMs} ms</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">RISK SCORE</span>
                <span className="text-amber-300 font-bold">{(result.selectedService.riskScore * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">PQC SECURITY</span>
                <span className="text-emerald-300 font-bold">{(result.selectedService.pqcScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart: Energy Landscape */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Hamiltonian Energy Landscape (Lower is Better)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Green = Optimal Choice</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [val, 'Hamiltonian Energy H(x)']}
                  />
                  <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isSelected ? '#10b981' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* QUBO Matrix Q_ij Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                Upper-Triangular QUBO Matrix Q(i, j)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">x^T Q x</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="p-1 text-left text-[10px]">Service</th>
                    {services.map((s, idx) => (
                      <th key={s.id} className="p-1 text-[10px]">S{idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixQ.map((row, r) => (
                    <tr key={r} className="border-b border-slate-850 hover:bg-slate-950/60">
                      <td className="p-1 text-left text-slate-400 text-[10px] truncate max-w-[120px]">
                        S{r + 1}: {services[r].name.substring(0, 14)}...
                      </td>
                      {row.map((val, c) => (
                        <td
                          key={c}
                          className={`p-1 text-[11px] ${
                            r === c
                              ? 'text-cyan-300 font-bold bg-cyan-950/30'
                              : r < c
                              ? 'text-indigo-400'
                              : 'text-slate-700'
                          }`}
                        >
                          {r <= c ? val : '0'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
