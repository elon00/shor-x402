/**
 * Algorand Live Node & Indexer Client for SHOR x402
 * Connects to AlgoNode Free Public Infrastructure for MainNet and TestNet.
 */
import { NetworkMode } from '../types';

export interface AlgodNodeStatus {
  lastRound: number;
  timeSinceLastRound: number;
  catchupTime: number;
  genesisId: string;
  genesisHash: string;
  isLive: boolean;
  network: NetworkMode;
}

export interface AccountHolding {
  address: string;
  algoMicroAlgos: number;
  algoBalance: number;
  usdcBalance: number;
  hasUsdcOptIn: boolean;
  round: number;
}

const MAINNET_ALGOD_URL = 'https://mainnet-api.algonode.cloud';
const TESTNET_ALGOD_URL = 'https://testnet-api.algonode.cloud';

export async function fetchLiveAlgodStatus(network: NetworkMode): Promise<AlgodNodeStatus> {
  const baseUrl = network === 'algorand-mainnet' ? MAINNET_ALGOD_URL : TESTNET_ALGOD_URL;

  try {
    const res = await fetch(`${baseUrl}/v2/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Algod status returned ${res.status}`);
    }

    const data = await res.json();
    return {
      lastRound: data['last-round'] || 42891042,
      timeSinceLastRound: data['time-since-last-round'] || 3,
      catchupTime: data['catchup-time'] || 0,
      genesisId: data['genesis-id'] || (network === 'algorand-mainnet' ? 'mainnet-v1.0' : 'testnet-v1.0'),
      genesisHash: data['genesis-hash'] || 'wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=',
      isLive: true,
      network,
    };
  } catch (err) {
    // Fallback if offline or local
    return {
      lastRound: 42891042 + Math.floor((Date.now() - 1700000000000) / 3300),
      timeSinceLastRound: 3,
      catchupTime: 0,
      genesisId: network === 'algorand-mainnet' ? 'mainnet-v1.0' : 'testnet-v1.0',
      genesisHash: 'wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=',
      isLive: false,
      network,
    };
  }
}

export async function fetchLiveAccountHolding(address: string, network: NetworkMode = 'algorand-mainnet'): Promise<AccountHolding | null> {
  const baseUrl = network === 'algorand-mainnet' ? MAINNET_ALGOD_URL : TESTNET_ALGOD_URL;
  try {
    const res = await fetch(`${baseUrl}/v2/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const algoBalance = (data.amount || 0) / 1000000;
    const usdcAssetId = network === 'algorand-mainnet' ? 31566704 : 10458941;
    const usdcAsset = (data.assets || []).find((a: any) => a['asset-id'] === usdcAssetId);
    const usdcBalance = usdcAsset ? (usdcAsset.amount || 0) / 1000000 : 0;
    const hasUsdcOptIn = !!usdcAsset;

    return {
      address,
      algoMicroAlgos: data.amount || 0,
      algoBalance,
      usdcBalance,
      hasUsdcOptIn,
      round: data.round || 64447633,
    };
  } catch (e) {
    return null;
  }
}

export function getExplorerTxUrl(txId: string, network: NetworkMode): string {
  if (network === 'algorand-mainnet') {
    return `https://allo.info/tx/${txId}`;
  }
  return `https://testnet.allo.info/tx/${txId}`;
}

export function getExplorerAccountUrl(address: string, network: NetworkMode): string {
  if (network === 'algorand-mainnet') {
    return `https://allo.info/account/${address}`;
  }
  return `https://testnet.allo.info/account/${address}`;
}
