import type { NetworkMode } from '../types';
import { NETWORKS } from '../config/networks.mjs';
import { isValidAddress } from 'algosdk';
export interface AlgodNodeStatus {
  lastRound: number; timeSinceLastRound: number; catchupTime: number;
  genesisId: string; genesisHash: string; isLive: boolean; network: NetworkMode;
}
export interface AccountHolding {
  address: string; algoMicroAlgos: number; algoBalance: number;
  usdcBalance: number; hasUsdcOptIn: boolean; round: number;
}
async function getJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Node request failed');
  return response.json();
}
export async function fetchLiveAlgodStatus(network: NetworkMode): Promise<AlgodNodeStatus> {
  try {
    const config = NETWORKS[network];
    if (!config) throw new Error('Unsupported network');
    const [status, params] = await Promise.all([
      getJson(config.algod + '/v2/status'), getJson(config.algod + '/v2/transactions/params') ]);
    if (params['genesis-hash'] !== config.genesisHash || params['genesis-id'] !== config.genesisId ||
        !Number.isSafeInteger(status['last-round']) || status['last-round'] <= 0) throw new Error('Wrong or unavailable network');
    return { lastRound: status['last-round'], timeSinceLastRound: status['time-since-last-round'] || 0,
      catchupTime: status['catchup-time'] || 0, genesisId: params['genesis-id'],
      genesisHash: params['genesis-hash'], isLive: true, network };
  } catch {
    return { lastRound: 0, timeSinceLastRound: 0, catchupTime: 0,
      genesisId: '', genesisHash: '', isLive: false, network };
  }
}
export async function fetchLiveAccountHolding(address: string, network: NetworkMode = 'algorand-testnet'): Promise<AccountHolding | null> {
  if (!isValidAddress(address) || !NETWORKS[network]) return null;
  try {
    const data = await getJson(NETWORKS[network].algod + '/v2/accounts/' + address);
    if (data?.address !== address || !Number.isSafeInteger(data.amount) || data.amount < 0 ||
        !Number.isSafeInteger(data.round) || data.round <= 0) return null;
    const holding = (data.assets || []).find((asset: any) => asset['asset-id'] === NETWORKS[network].assetId);
    const microUsdc = holding?.amount ?? 0;
    if (!Number.isSafeInteger(microUsdc) || microUsdc < 0) return null;
    return { address, algoMicroAlgos: data.amount, algoBalance: data.amount / 1e6,
      usdcBalance: microUsdc / 1e6, hasUsdcOptIn: !!holding, round: data.round };
  } catch { return null; }
}
export function getExplorerTxUrl(txId: string, network: NetworkMode): string {
  return (network === 'algorand-mainnet' ? 'https://allo.info/tx/' : 'https://testnet.allo.info/tx/') + encodeURIComponent(txId);
}
export function getExplorerAccountUrl(address: string, network: NetworkMode): string {
  return (network === 'algorand-mainnet' ? 'https://allo.info/account/' : 'https://testnet.allo.info/account/') + encodeURIComponent(address);
}
