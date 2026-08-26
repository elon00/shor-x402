import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Check, Copy, Download, ExternalLink, ArrowRight } from 'lucide-react';
import { NetworkMode } from '../types';

interface QrCodeViewerProps {
  address: string;
  network: NetworkMode;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({ address, network }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    // Standard Algorand URI scheme compatible with Binance, Pera, Defly, and all mobile exchange scanners
    const qrText = address;
    QRCode.toDataURL(qrText, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [address, network]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-950/80 border border-teal-700/50 text-teal-400">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-mono">Scan with Binance / Exchange App</h4>
            <p className="text-[10px] text-slate-400">Deposit ALGO directly to this Algorand address</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
          {network === 'algorand-mainnet' ? 'MainNet' : 'TestNet'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* QR Code Frame */}
        <div className="bg-white p-3 rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Algorand Deposit QR Code" className="w-36 h-36 rounded" />
          ) : (
            <div className="w-36 h-36 bg-slate-200 animate-pulse rounded flex items-center justify-center text-slate-400 text-xs">
              Generating...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              <span>Open Binance App ? Wallets ? Withdraw ? ALGO</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
              <span>Tap QR Scanner icon & scan this QR code</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
              <span>Send 1-2 ALGO to activate account & gas fees</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Address!' : 'Copy Address'}
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`algorand-deposit-qr-${address.substring(0, 8)}.png`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-700/50 text-teal-300 text-xs font-mono transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Save QR
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
