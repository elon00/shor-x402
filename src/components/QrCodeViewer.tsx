import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Check,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { NetworkMode } from '../types';

interface QrCodeViewerProps {
  address: string;
  network: NetworkMode;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({ address, network }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrFormat, setQrFormat] = useState<'raw' | 'uri'>('raw');
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  const cleanAddress = (address || '').trim().toUpperCase();

  // Generate QR Code with Maximum Error Correction (Level H)
  useEffect(() => {
    if (!cleanAddress) return;
    const qrPayload = qrFormat === 'uri' ? `algorand://${cleanAddress}` : cleanAddress;

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [cleanAddress, qrFormat]);

  // Live on-chain balance check
  const checkOnChainBalance = async () => {
    if (!cleanAddress) return;
    setIsCheckingBalance(true);
    const baseUrl =
      network === 'algorand-mainnet'
        ? 'https://mainnet-api.algonode.cloud'
        : 'https://testnet-api.algonode.cloud';

    try {
      const res = await fetch(`${baseUrl}/v2/accounts/${cleanAddress}`);
      if (res.ok) {
        const data = await res.json();
        const algo = (data.amount || 0) / 1000000;
        setLiveBalance(algo);
      } else {
        setLiveBalance(0);
      }
    } catch (e) {
      setLiveBalance(0);
    } finally {
      setIsCheckingBalance(false);
      setLastCheckTime(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkOnChainBalance();
    const interval = setInterval(checkOnChainBalance, 6000);
    return () => clearInterval(interval);
  }, [cleanAddress, network]);

  const copyAddress = () => {
    navigator.clipboard.writeText(cleanAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-950/80 border border-teal-700/50 text-teal-400">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-mono flex items-center gap-1.5">
              Live Algorand Deposit QR Code
              <span className="px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-normal">
                Binance / Pera Verified
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Scan from Binance or any mobile crypto wallet to deposit ALGO</p>
          </div>
        </div>

        {/* Live On-Chain Balance Badge */}
        <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-400">On-Chain:</span>
          <span className={`font-bold ${liveBalance && liveBalance > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {liveBalance !== null ? `${liveBalance.toFixed(3)} ALGO` : 'Checking...'}
          </span>
          <button
            onClick={checkOnChainBalance}
            disabled={isCheckingBalance}
            title="Refresh on-chain balance"
            className="p-0.5 hover:text-teal-400 text-slate-500 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingBalance ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
        {/* QR Code Container */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="bg-white p-3 rounded-xl shadow-2xl border-2 border-teal-500/30 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Algorand Deposit QR Code"
                className="w-40 h-40 object-contain rounded"
              />
            ) : (
              <div className="w-40 h-40 bg-slate-200 animate-pulse rounded flex items-center justify-center text-slate-500 text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setQrFormat('raw')}
              className={`px-2 py-0.5 rounded ${qrFormat === 'raw' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Raw (Binance)
            </button>
            <button
              onClick={() => setQrFormat('uri')}
              className={`px-2 py-0.5 rounded ${qrFormat === 'uri' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              URI (Pera/Defly)
            </button>
          </div>
        </div>

        {/* Guidance & Verification Details */}
        <div className="flex-1 space-y-3 text-xs">
          {/* Important Binance Withdrawal Rules Alert */}
          <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-[11px] text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              Why transactions fail on Binance (Checklist):
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[10px] font-sans">
              <li><strong>Network Selection</strong>: Must select <strong>Algorand (ALGO)</strong> network in Binance (NOT BSC/BEP20 or ERC20).</li>
              <li><strong>Minimum Withdrawal</strong>: Binance enforces a minimum withdrawal of <strong>~10 ALGO</strong> (with 0.002 ALGO network fee). Trying to send less than 10 ALGO causes Binance to reject the transaction.</li>
            </ul>
          </div>

          {/* 3 Steps */}
          <div className="space-y-1 text-[11px] text-slate-300 font-mono">
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              <span>In Binance App: <strong>Wallets</strong> ? <strong>Spot</strong> ? <strong>Withdraw</strong> ? <strong>ALGO</strong></span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
              <span>Tap <strong>QR Scanner</strong> icon & scan the QR on the left</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
              <span>Enter <strong>10 ALGO</strong> (or more) and confirm withdrawal</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Address!' : 'Copy Full Address'}
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`algorand-deposit-qr-${cleanAddress.substring(0, 8)}.png`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-700/50 text-teal-300 text-xs font-mono transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </a>
            )}
            <a
              href={`https://allo.info/account/${cleanAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-mono ml-auto"
            >
              <ExternalLink className="w-3 h-3" />
              Allo Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
