import React from 'react';
import {
  SlidersHorizontal,
  ShieldAlert,
  Lock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
} from 'lucide-react';
import { GovernancePolicy, PaymentAsset } from '../types';

interface GovernanceViewProps {
  policy: GovernancePolicy;
  onUpdatePolicy: (policy: GovernancePolicy) => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  policy,
  onUpdatePolicy,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Mandatory Policy Engine & Financial Safety Controls
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              AI agents are never granted unbounded wallet authority. The SHOR policy engine enforces deterministic caps, risk boundaries, and human-in-the-loop thresholds before signing x402 transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdatePolicy({
                  ...policy,
                  circuitBreakerActive: !policy.circuitBreakerActive,
                })
              }
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow ${
                policy.circuitBreakerActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-rose-500/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>
                {policy.circuitBreakerActive ? 'CIRCUIT BREAKER ENGAGED (LOCKED)' : 'Emergency Kill-Switch'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Caps Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
            <Coins className="w-4 h-4 text-cyan-400" />
            Budget & Spending Boundaries
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>MAX PER SINGLE REQUEST:</span>
                <span className="text-cyan-400 font-bold">${policy.maxPerRequestUsdc.toFixed(3)} USDC</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.10"
                step="0.001"
                value={policy.maxPerRequestUsdc}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, maxPerRequestUsdc: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>MAX PER AUTONOMOUS TASK:</span>
                <span className="text-cyan-400 font-bold">${policy.maxPerTaskUsdc.toFixed(3)} USDC</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.25"
                step="0.005"
                value={policy.maxPerTaskUsdc}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, maxPerTaskUsdc: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>DAILY SPENDING LIMIT:</span>
                <span className="text-cyan-400 font-bold">${policy.dailyBudgetUsdc.toFixed(2)} USDC</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="5.00"
                step="0.10"
                value={policy.dailyBudgetUsdc}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, dailyBudgetUsdc: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Current Spent Today: ${policy.dailySpentUsdc.toFixed(4)} USDC</span>
                <span>Remaining: ${(policy.dailyBudgetUsdc - policy.dailySpentUsdc).toFixed(4)} USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Human Approval Triggers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Human Approval & Risk Limits
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>MAX ALLOWED RISK THRESHOLD:</span>
                <span className="text-amber-400 font-bold">{(policy.maxRiskThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={policy.maxRiskThreshold}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, maxRiskThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>REQUIRE HUMAN APPROVAL ABOVE (COST):</span>
                <span className="text-indigo-300 font-bold">${policy.requireHumanApprovalAboveUsdc.toFixed(3)} USDC</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={policy.requireHumanApprovalAboveUsdc}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, requireHumanApprovalAboveUsdc: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>REQUIRE HUMAN APPROVAL ABOVE (RISK):</span>
                <span className="text-indigo-300 font-bold">{(policy.requireHumanApprovalAboveRisk * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={policy.requireHumanApprovalAboveRisk}
                onChange={(e) =>
                  onUpdatePolicy({ ...policy, requireHumanApprovalAboveRisk: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
