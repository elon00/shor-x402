import React from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  Coins,
  Cpu,
  BookOpen,
  RefreshCw,
  Sliders,
  Terminal,
  Activity,
  KeyRound,
  Store,
  SlidersHorizontal,
} from 'lucide-react';
import { NetworkMode, WalletState, AgentStateId } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletState;
  onFaucetClaim: () => void;
  onNetworkChange: (net: NetworkMode) => void;
  currentAgentState: AgentStateId;
  onOpenDocs: () => void;
  activeRound: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  wallet,
  onFaucetClaim,
  onNetworkChange,
  currentAgentState,
  onOpenDocs,
  activeRound,
}) => {
  const tabs = [
    { id: 'agent-hub', label: 'Agent Command Hub', icon: Terminal },
    { id: 'conway-engine', label: 'Conway State Engine', icon: Activity },
    { id: 'qubo-solver', label: 'QUBO Optimizer', icon: Cpu },
    { id: 'algorand-explorer', label: 'x402 & Algorand Ledger', icon: Layers },
    { id: 'pqc-security', label: 'PQC & Identity Vault', icon: KeyRound },
    { id: 'service-marketplace', label: 'Paid Services & Sandbox', icon: Store },
    { id: 'governance', label: 'Policy & Safety', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/80 text-xs">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 text-white font-bold shadow-md shadow-cyan-950/40">
            <span className="font-mono text-sm tracking-tighter">Sx</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">SHOR x402</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                MainNet Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Post-Quantum Autonomous Agent Commerce on Algorand
            </p>
          </div>
        </div>

        {/* Status Indicators & Wallet */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* PQC Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">PQC:</span>
            <span className="font-semibold text-indigo-200">ML-DSA-65 (FIPS 204)</span>
          </div>

          {/* Algorand Round */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Round:</span>
            <span className="text-emerald-400 font-semibold">{activeRound.toLocaleString()}</span>
          </div>

          {/* Network Switcher */}
          <select
            value={wallet.network}
            onChange={(e) => onNetworkChange(e.target.value as NetworkMode)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="algorand-mainnet">Algorand MainNet</option>
            <option value="algorand-testnet">Algorand TestNet</option>
            <option value="algorand-devnet">Local DevNet</option>
          </select>

          {/* Wallet Balances & Faucet */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">${wallet.usdcBalance.toFixed(3)}</span>
              <span className="text-slate-500 text-[10px]">USDC</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-1 font-mono text-xs text-slate-300">
              <span>{wallet.algoBalance.toFixed(2)}</span>
              <span className="text-slate-500 text-[10px]">ALGO</span>
            </div>
            <button
              onClick={onFaucetClaim}
              title="Add 0.50 USDC & 5 ALGO to Agent Wallet"
              className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Architecture Docs Button */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors text-xs font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Spec & Math</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
