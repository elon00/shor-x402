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
  Save,
  RotateCcw,
} from 'lucide-react';
import { NetworkMode, WalletState, AgentStateId } from '../types';
import {
  saveLutePublicKey,
  clearSavedLutePublicKey,
  isValidAlgorandAddress,
} from '../services/walletConnector';

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
  onDisconnectWallet?: () => void;
  onUpdateCustomAddress?: (newAddress: string) => void;
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
  onDisconnectWallet,
  onUpdateCustomAddress,
  walletProviderName = 'Disconnected',
}) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inputAddress, setInputAddress] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

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

  const handleSaveCustomKey = () => {
    setInputError(null);
    const trimmed = inputAddress.trim().toUpperCase();
    if (!trimmed) {
      setInputError('Please enter an Algorand public address.');
      return;
    }
    if (!isValidAlgorandAddress(trimmed)) {
      setInputError('Invalid address: Algorand addresses must include a valid checksum.');
      return;
    }

    saveLutePublicKey(trimmed);
    if (onUpdateCustomAddress) {
      onUpdateCustomAddress(trimmed);
    }
    setSaveSuccess(true);
    setInputAddress('');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetToDefault = () => {
    clearSavedLutePublicKey();
    onDisconnectWallet?.();
    setInputAddress('');
    setInputError(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <p role="status" className="m-0 border-b border-amber-800/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-200">Development build. Payments are disabled while settlement and replay verification are completed.</p>
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
                {wallet.network === 'algorand-mainnet' ? 'MainNet selected' : 'TestNet selected'}
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
          </select>

          {/* 1-Click Lute Wallet Button */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-cyan-950/80 border border-teal-600/40 text-teal-200 hover:text-white hover:border-teal-400 transition-all font-mono text-xs shadow-sm cursor-pointer"
            title="Manage Pera wallet or view a public address"
          >
            <Wallet className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold">
              {wallet.address ? `${wallet.address.substring(0, 5)}...${wallet.address.substring(53)}` : 'Connect wallet'}
            </span>
          </button>

          {/* Wallet Balances & Faucet */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">{wallet.balanceStatus === 'fresh' ? '$' + wallet.usdcBalance.toFixed(3) : '—'}</span>
              <span className="text-slate-500 text-[10px]">USDC</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-1 font-mono text-xs text-slate-300">
              <span>{wallet.balanceStatus === 'fresh' ? wallet.algoBalance.toFixed(2) : '—'}</span>
              <span className="text-slate-500 text-[10px]">ALGO</span>
            </div>
            <button
              onClick={onFaucetClaim}
              title="Open the TestNet faucet"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 text-sm text-amber-200" role="status">
        Development preview · Paid services are disabled while settlement verification is completed.
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

      {/* Lute Wallet & Algorand Public Key Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-950/80 border border-teal-700/50 text-teal-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="wallet-dialog-title" className="font-bold text-base text-slate-100 font-mono">Wallet and public address</h3>
                  <p className="text-xs text-slate-400">Connect Pera with QR or extension, or view an address without signing access</p>
                </div>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                aria-label="Close wallet dialog"
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider & Network Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-mono">SESSION</span>
                <span className="text-xs font-bold text-teal-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  {walletProviderName} · {wallet.sessionStatus || 'disconnected'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-mono">SELECTED NETWORK</span>
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {wallet.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Algorand TestNet'}
                </span>
              </div>
            </div>

            {/* Active Algorand Public Key / Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono font-medium">Public address:</span>
                <button
                  onClick={() => copyToClipboard(wallet.address, 'address')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                >
                  {copiedKey === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'address' ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                {wallet.address}
              </div>
            </div>

            {/* Set / Paste Custom Lute Wallet Public Key */}
            <div className="space-y-2 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <label htmlFor="watch-address" className="text-sm font-mono font-semibold text-slate-200">
                  View a public address
                </label>
                <a
                  href="https://perawallet.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5 font-mono"
                >
                  Open Pera <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  id="watch-address"
                  type="text"
                  placeholder="Paste a public Algorand address (watch-only)"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleSaveCustomKey}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
              {inputError && (
                <p className="text-[11px] text-rose-400 font-mono">{inputError}</p>
              )}
              {saveSuccess && (
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Address saved for viewing. Signing is disconnected.
                </p>
              )}
            </div>

            {/* 1-Click USDC Asset Manager */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                  <Coins className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Circle USDC (ASA {wallet.network === 'algorand-mainnet' ? '31566704' : '10458941'})</span>
                </div>
                <p className="text-[10px] text-slate-400">Official settlement asset for Global x402 Challenge on Algorand.</p>
              </div>
              <a
                href={wallet.network === 'algorand-mainnet' ? `https://allo.info/asset/31566704` : `https://testnet.allo.info/asset/10458941`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 rounded-lg text-xs font-mono flex items-center gap-1 flex-shrink-0"
              >
                <span>View USDC ASA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Actions & Links */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <a
                  href={wallet.network === 'algorand-mainnet' ? `https://allo.info/account/${wallet.address}` : `https://testnet.allo.info/account/${wallet.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Allo Explorer
                </a>
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
                  title="Disconnect wallet and clear saved address"
                >
                  <RotateCcw className="w-3 h-3" />
                  Disconnect
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (wallet.sessionStatus !== 'connecting') onConnectWallet?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-xs font-medium transition-colors cursor-pointer"
                >
                  {wallet.sessionStatus === 'connecting' ? 'Connecting…' : 'Connect Pera'}
                </button>
                <button
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
