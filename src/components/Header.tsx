import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  Coins,
  Cpu,
  BookOpen,
  RefreshCw,
  Terminal,
  Activity,
  KeyRound,
  Store,
  SlidersHorizontal,
  Wallet,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { NetworkMode, WalletState, AgentStateId } from '../types';
import { OFFICIAL_ALGORAND_ACCOUNTS } from '../services/walletConnector';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletState;
  onFaucetClaim: () => void;
  onNetworkChange: (net: NetworkMode) => void;
  currentAgentState: AgentStateId;
  onOpenDocs: () => void;
  activeRound: number;
  onConnectWallet?: () => void;
  walletProviderName?: string;
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
  onConnectWallet,
  walletProviderName = 'Phantom / Algorand',
}) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tabs = [
    { id: 'agent-hub', label: 'Agent Command Hub', icon: Terminal },
    { id: 'conway-engine', label: 'Conway State Engine', icon: Activity },
    { id: 'qubo-solver', label: 'QUBO Optimizer', icon: Cpu },
    { id: 'algorand-explorer', label: 'x402 & Algorand Ledger', icon: Layers },
    { id: 'pqc-security', label: 'PQC & Identity Vault', icon: KeyRound },
    { id: 'service-marketplace', label: 'Paid Services & Sandbox', icon: Store },
    { id: 'governance', label: 'Policy & Safety', icon: SlidersHorizontal },
  ];

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentAccountInfo =
    wallet.network === 'algorand-mainnet'
      ? OFFICIAL_ALGORAND_ACCOUNTS.mainnet
      : OFFICIAL_ALGORAND_ACCOUNTS.testnet;

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
                {wallet.network === 'algorand-mainnet' ? 'MainNet Live' : 'TestNet Live'}
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

          {/* 1-Click Phantom / Wallet Connect Button */}
          <button
            onClick={() => {
              if (onConnectWallet) onConnectWallet();
              setIsWalletModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-600/40 text-purple-200 hover:text-white hover:border-purple-500 transition-all font-mono text-xs shadow-sm cursor-pointer"
            title="Auto Connect Phantom or View Algorand Public Address"
          >
            <Wallet className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">{wallet.address ? `${wallet.address.substring(0, 4)}...${wallet.address.substring(54)}` : 'Connect Wallet'}</span>
          </button>

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
              title="Add test assets into Agent Wallet"
              className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Architecture Docs Button */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors text-xs font-medium cursor-pointer"
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

      {/* 1-Click Algorand & Phantom Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-700/50 text-purple-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 font-mono">Algorand & Phantom Wallet Hub</h3>
                  <p className="text-xs text-slate-400">1-Click Auto Connect & Official Account Keys</p>
                </div>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider & Network Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-mono">CONNECTED PROVIDER</span>
                <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  {walletProviderName}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-mono">SETTLEMENT CHAIN</span>
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {wallet.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Algorand TestNet'}
                </span>
              </div>
            </div>

            {/* Official Algorand Public Key / Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono font-medium">Algorand Public Address (58-char Base32):</span>
                <button
                  onClick={() => copyToClipboard(wallet.address, 'address')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {copiedKey === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'address' ? 'Copied Address!' : 'Copy Address'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                {wallet.address}
              </div>
            </div>

            {/* Official Algorand Mnemonic Seed Phrase */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono font-medium">Algorand 25-Word Mnemonic Passphrase:</span>
                <button
                  onClick={() => copyToClipboard(currentAccountInfo.mnemonic, 'mnemonic')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  {copiedKey === 'mnemonic' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'mnemonic' ? 'Copied Mnemonic!' : 'Copy 25-Word Seed'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 leading-relaxed break-words select-all">
                {currentAccountInfo.mnemonic}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Use this seed to import this pre-configured account directly into your Phantom, Pera, or Defly Wallet.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <a
                href={wallet.network === 'algorand-mainnet' ? `https://allo.info/account/${wallet.address}` : `https://testnet.allo.info/account/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 font-mono"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Allo Explorer
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onConnectWallet) onConnectWallet();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold transition-colors"
                >
                  Auto-Sync Phantom
                </button>
                <button
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
