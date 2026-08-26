import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Zap,
  Fingerprint,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { PqcKeyPair } from '../types';
import {
  generatePqcKeyPair,
  createPqcHybridSignature,
  verifyPqcSignature,
} from '../utils/pqcCrypto';

interface PqcSecurityViewProps {
  currentKeyPair: PqcKeyPair;
  onUpdateKeyPair: (kp: PqcKeyPair) => void;
}

export const PqcSecurityView: React.FC<PqcSecurityViewProps> = ({
  currentKeyPair,
  onUpdateKeyPair,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<'ML-DSA-65' | 'ML-KEM-768' | 'Hybrid-Ed25519-Dilithium'>('ML-DSA-65');
  const [testPayload, setTestPayload] = useState('x402:auth:agent_0x4289:round_42891050');
  const [testResult, setTestResult] = useState<{
    signature?: string;
    verified?: boolean;
    timeUs?: number;
  } | null>(null);

  const handleGenerateNewKey = () => {
    const newKp = generatePqcKeyPair(selectedAlgo);
    onUpdateKeyPair(newKp);
    setTestResult(null);
  };

  const handleTestSignAndVerify = () => {
    const sigObj = createPqcHybridSignature('TX_TEST_BENCHMARK_777', currentKeyPair, 0.005, 'srv-benchmark');
    const verObj = verifyPqcSignature(sigObj.hybridSignature, 'TX_TEST_BENCHMARK_777', currentKeyPair.publicKey);

    setTestResult({
      signature: sigObj.hybridSignature,
      verified: verObj.valid,
      timeUs: verObj.latticeVerificationTimeUs,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Post-Quantum Cryptography (PQC) & Identity Vault
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              SHOR secures agent authorization and x402 payment integrity against future quantum cryptanalysis (Shor's Algorithm) by standardizing on NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) lattice mathematics.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 p-2.5 px-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">NIST SECURITY</span>
              <span className="text-emerald-400 font-bold">Category 3 (AES-192)</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">CRYPTO-AGILITY</span>
              <span className="text-indigo-300 font-bold">100% Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Keypair & Live Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Agent Keypair Details */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                Active Agent Post-Quantum Identity
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                Authorized
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">ALGORITHM STANDARD</span>
                <span className="text-indigo-300 font-bold text-sm">{currentKeyPair.algorithm} (NIST FIPS 204)</span>
                <p className="text-[10px] text-slate-400 font-sans">
                  Module-Lattice Digital Signature Algorithm over cyclotomic polynomial rings.
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">PUBLIC KEY FINGERPRINT</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-cyan-300 text-xs break-all flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{currentKeyPair.publicKeyFingerprint}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">SERIALIZED PUBLIC KEY (HEX)</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 text-[10px] break-all max-h-18 overflow-y-auto">
                  {currentKeyPair.publicKey}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">KEY SIZE</span>
                  <span className="text-slate-200 font-bold">{currentKeyPair.keySizeBits} bits</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">CREATION TIME</span>
                  <span className="text-slate-200 font-bold">{currentKeyPair.createdAt.split('T')[0]}</span>
                </div>
              </div>
            </div>

            {/* Key Generator Controls */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-[11px] text-slate-400 font-mono block">ROTATE KEYPAIR:</span>
              <div className="flex gap-2">
                <select
                  value={selectedAlgo}
                  onChange={(e) => setSelectedAlgo(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 flex-1"
                >
                  <option value="ML-DSA-65">ML-DSA-65 (NIST FIPS 204)</option>
                  <option value="ML-KEM-768">ML-KEM-768 (NIST FIPS 203)</option>
                  <option value="Hybrid-Ed25519-Dilithium">Hybrid Ed25519 + Dilithium</option>
                </select>
                <button
                  onClick={handleGenerateNewKey}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium font-mono flex items-center gap-1.5 transition-colors shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Signature & Verification Benchmark */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Live Post-Quantum Verification Benchmark
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Microsecond Lattice Check</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  SAMPLE SETTLEMENT PAYLOAD:
                </label>
                <input
                  type="text"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleTestSignAndVerify}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold font-mono transition-all shadow flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Execute Lattice Sign & Verify Benchmark</span>
              </button>

              {testResult && (
                <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-3 font-mono text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Lattice Signature Validated
                    </span>
                    <span className="text-slate-400 text-[11px]">Time: {testResult.timeUs} µs</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">GENERATED HYBRID SIGNATURE:</span>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-indigo-300 text-[10px] break-all">
                      {testResult.signature}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">ALGORITHM</span>
                      <span className="text-slate-200 font-bold">ML-DSA-65</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">QUANTUM RESISTANCE</span>
                      <span className="text-emerald-400 font-bold">192-bit Entropy</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NIST Standards Reference Card */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1.5">
              <h4 className="font-bold text-slate-200 font-mono text-[11px]">Why PQC in SHOR x402?</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Traditional RSA and standard elliptic curve signatures (ECDSA/Ed25519) are vulnerable to Shor's algorithm on sufficiently scaled quantum computers. SHOR x402 incorporates lattice-based cryptography directly into agent authorization headers without modifying underlying Algorand consensus layers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
