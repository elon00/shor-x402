import React, { useState } from 'react';
import {
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  FileCode,
  ArrowDownRight,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { AlgorandTransaction, NetworkMode } from '../types';
import { HTTP_PACKET_LOGS, HttpLogEntry } from '../services/apiClient';

interface AlgorandExplorerViewProps {
  transactions: AlgorandTransaction[];
  network: NetworkMode;
  activeRound: number;
  selectedTxId?: string | null;
}

export const AlgorandExplorerView: React.FC<AlgorandExplorerViewProps> = ({
  transactions,
  network,
  activeRound,
  selectedTxId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<AlgorandTransaction | null>(() => {
    if (selectedTxId) {
      return transactions.find((t) => t.txId === selectedTxId) || null;
    }
    return transactions.length > 0 ? transactions[0] : null;
  });

  const [activeTab, setActiveTab] = useState<'transactions' | 'http-packets'>('transactions');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Algorand x402 Settlement Ledger & HTTP Inspector
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Every autonomous agent micro-payment settles on Algorand ({network}) with sub-second finality and post-quantum cryptographic proof attachments.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 p-2.5 px-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">CONSENSUS ROUND</span>
              <span className="text-emerald-400 font-bold">{activeRound.toLocaleString()}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL TXS</span>
              <span className="text-cyan-400 font-bold">{transactions.length}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">TX FEE</span>
              <span className="text-slate-300 font-bold">0.001 ALGO</span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
              activeTab === 'transactions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Algorand Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('http-packets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
              activeTab === 'http-packets'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw HTTP 402 Packet Trace ({HTTP_PACKET_LOGS.length})
          </button>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'transactions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Transaction Table */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
                Settled Micro-Payment Stream
              </h3>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No Algorand transactions recorded yet. Execute an autonomous goal to trigger live x402 settlements.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {transactions.map((tx) => {
                    const isSelected = selectedTx?.txId === tx.txId;
                    return (
                      <button
                        key={tx.txId}
                        onClick={() => setSelectedTx(tx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-xs font-bold font-mono text-slate-200 truncate max-w-[180px]">
                              {tx.txId.substring(0, 16)}...
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            ${tx.amount.toFixed(4)} {tx.asset}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                          <span className="truncate max-w-[200px]">{tx.serviceName}</span>
                          <span>Round {tx.confirmedRound}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Transaction Inspector */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center justify-between">
                <span>Transaction Inspector</span>
                {selectedTx && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Confirmed
                  </span>
                )}
              </h3>

              {selectedTx ? (
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">TRANSACTION ID</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-cyan-300">
                      <span className="truncate mr-2">{selectedTx.txId}</span>
                      <button
                        onClick={() => copyToClipboard(selectedTx.txId, 'txid')}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {copiedId === 'txid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">AMOUNT</span>
                      <span className="text-slate-200 font-bold">${selectedTx.amount.toFixed(4)} {selectedTx.asset}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">NETWORK FEE</span>
                      <span className="text-slate-200 font-bold">{selectedTx.feeAlgo} ALGO</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">SENDER (AGENT WALLET)</span>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300 truncate">
                      {selectedTx.sender}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">RECEIVER (SERVICE PROVIDER)</span>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300 truncate">
                      {selectedTx.receiver}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">PQC HYBRID SIGNATURE (ML-DSA-65 + ED25519)</span>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-indigo-300 text-[10px] break-all leading-tight">
                      {selectedTx.pqcSignature}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">X402 PROOF TOKEN</span>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-300 text-[10px] break-all">
                      {selectedTx.x402ProofToken || 'x402_proof_verified_round_' + selectedTx.confirmedRound}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  Select a transaction to inspect on-chain details.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HTTP 402 Packet Trace View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Raw HTTP 402 Payment-Required Packet Stream
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Interceptor</span>
          </div>

          {HTTP_PACKET_LOGS.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No HTTP packets logged yet. Trigger an autonomous goal or use the Sandbox to see the real HTTP 402 handshake.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {HTTP_PACKET_LOGS.map((pkt) => (
                <div
                  key={pkt.id}
                  className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          pkt.status === 402
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : pkt.status === 200
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}
                      >
                        {pkt.method} {pkt.status} {pkt.statusText}
                      </span>
                      <span className="text-slate-300 truncate max-w-sm">{pkt.url}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{pkt.timestamp.split('T')[1].substring(0, 8)}</span>
                  </div>

                  {/* Headers */}
                  {Object.keys(pkt.headersReceived).length > 0 && (
                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[10px] space-y-1 text-slate-300">
                      <span className="text-slate-500 block text-[9px] uppercase">RESPONSE HEADERS (x402):</span>
                      {Object.entries(pkt.headersReceived).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-cyan-400 font-semibold">{k}:</span>
                          <span className="text-slate-300 break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Response Body Preview */}
                  {pkt.responseBody && (
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px] text-slate-300 overflow-x-auto max-h-24">
                      <pre>{JSON.stringify(pkt.responseBody, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
