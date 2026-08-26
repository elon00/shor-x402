import React, { useState } from 'react';
import {
  Store,
  Zap,
  ShieldCheck,
  Coins,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code,
  FileCode,
} from 'lucide-react';
import { PaidService, WalletState, PqcKeyPair, AlgorandTransaction } from '../types';
import { executeX402ServiceRequest } from '../services/apiClient';

interface ServiceMarketplaceViewProps {
  services: PaidService[];
  onAddService: (service: PaidService) => void;
  wallet: WalletState;
  pqcKey: PqcKeyPair;
  onTxCreated: (tx: AlgorandTransaction) => void;
}

export const ServiceMarketplaceView: React.FC<ServiceMarketplaceViewProps> = ({
  services,
  onAddService,
  wallet,
  pqcKey,
  onTxCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'sandbox' | 'register'>('catalog');
  const [selectedService, setSelectedService] = useState<PaidService>(services[0]);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Form for custom endpoint registration
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newCost, setNewCost] = useState('0.005');
  const [newDesc, setNewDesc] = useState('');

  const handleTestService = async (service: PaidService) => {
    setSandboxLoading(true);
    setSandboxResult(null);

    const res = await executeX402ServiceRequest(service, wallet, pqcKey, onTxCreated);
    setSandboxResult(res);
    setSandboxLoading(false);
  };

  const handleRegisterService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEndpoint) return;

    const newSrv: PaidService = {
      id: `srv-custom-${Date.now()}`,
      name: newName,
      provider: newProvider || 'Custom Provider',
      category: 'custom',
      endpoint: newEndpoint,
      description: newDesc || 'User-registered custom x402 digital endpoint.',
      costUsdc: parseFloat(newCost) || 0.005,
      costAlgo: (parseFloat(newCost) || 0.005) * 4,
      latencyMs: 180,
      riskScore: 0.15,
      pqcScore: 0.90,
      reliability: 0.99,
      pqcAlgorithm: 'ML-DSA-65 Compatible',
      recipientAddress: 'CUSTOMADDR1234567890ABCDEFGHJKLMNPQRSTUVWXYZ234567890ABCDEF',
      available: true,
    };

    onAddService(newSrv);
    setSelectedService(newSrv);
    setActiveTab('catalog');
    setNewName('');
    setNewEndpoint('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Decentralized Service Registry & x402 Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              AI agents query this registry to discover machine-payable digital services. Test raw HTTP 402 $\to$ 200 settlement cycles or register custom endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Catalog ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              x402 Sandbox Tester
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                activeTab === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register API</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                    {srv.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    ${srv.costUsdc.toFixed(4)} USDC
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{srv.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{srv.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center">
                  <div className="p-1 bg-slate-950 rounded border border-slate-850">
                    <span className="text-slate-500 block">LATENCY</span>
                    <span className="text-slate-200 font-bold">{srv.latencyMs}ms</span>
                  </div>
                  <div className="p-1 bg-slate-950 rounded border border-slate-850">
                    <span className="text-slate-500 block">RISK</span>
                    <span className="text-amber-400 font-bold">{(srv.riskScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-1 bg-slate-950 rounded border border-slate-850">
                    <span className="text-slate-500 block">PQC</span>
                    <span className="text-emerald-400 font-bold">{(srv.pqcScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedService(srv);
                    setActiveTab('sandbox');
                    handleTestService(srv);
                  }}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test x402 Request in Sandbox</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sandbox Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                Target Service Selector
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-mono">SELECT SERVICE:</label>
                <select
                  value={selectedService.id}
                  onChange={(e) => {
                    const s = services.find((srv) => srv.id === e.target.value);
                    if (s) setSelectedService(s);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.costUsdc.toFixed(4)} USDC)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Endpoint:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{selectedService.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost:</span>
                  <span className="text-cyan-300 font-bold">${selectedService.costUsdc.toFixed(4)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="text-slate-400 truncate max-w-[160px]">{selectedService.recipientAddress}</span>
                </div>
              </div>

              <button
                onClick={() => handleTestService(selectedService)}
                disabled={sandboxLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold font-mono transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sandboxLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing x402 Cycle...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Send Raw Request (Trigger 402 &rarr; 200)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sandbox Live Response Output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  Live Handshake & Payload Inspector
                </h3>
                {sandboxResult && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cycle Complete
                  </span>
                )}
              </div>

              {sandboxResult ? (
                <div className="space-y-3 font-mono text-xs animate-in fade-in">
                  {/* Step 1: 402 Challenge */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                      <span>1. HTTP 402 Payment Required</span>
                      <span>Scheme: x402</span>
                    </div>
                    <pre className="text-[10px] text-slate-300 overflow-x-auto max-h-24 bg-slate-900/60 p-2 rounded">
                      {JSON.stringify(sandboxResult.http402Challenge, null, 2)}
                    </pre>
                  </div>

                  {/* Step 2: Algorand Settlement */}
                  {sandboxResult.transaction && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
                        <span>2. Algorand Transaction Broadcast</span>
                        <span>Round: {sandboxResult.transaction.confirmedRound}</span>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        TxId: <span className="text-cyan-300">{sandboxResult.transaction.txId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        PQC Signature: {sandboxResult.transaction.pqcSignature}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Verified 200 Payload */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-emerald-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                      <span>3. HTTP 200 OK — Verified Delivery</span>
                      <span>PQC Validated</span>
                    </div>
                    <pre className="text-[10px] text-slate-200 overflow-x-auto max-h-36 bg-slate-900/60 p-2 rounded">
                      {JSON.stringify(sandboxResult.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  Click "Send Raw Request" to initiate the autonomous x402 payment lifecycle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 font-mono mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Register Custom Paid x402 Endpoint
          </h3>

          <form onSubmit={handleRegisterService} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">SERVICE NAME:</label>
              <input
                type="text"
                required
                placeholder="e.g. My Autonomous AI Model Endpoint"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">PROVIDER / LAB:</label>
                <input
                  type="text"
                  placeholder="e.g. Acme AI Foundry"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">PRICE IN USDC:</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ENDPOINT URL (REL / ABSOLUTE):</label>
              <input
                type="text"
                required
                placeholder="e.g. /api/services/custom-feed or https://api.myagent.io/v1"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">DESCRIPTION:</label>
              <textarea
                rows={2}
                placeholder="Brief summary of digital payload..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold font-mono transition-colors shadow"
            >
              Add Endpoint to Registry
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
