import type { X402Challenge, AlgorandTransaction, PaidService, WalletState, PqcKeyPair } from '../types';
import { resolveApiEndpoint } from '../infrastructure/public-config.mjs';

export interface HttpLogEntry {
  id: string; timestamp: string; method: string; url: string; status: number; statusText: string;
  headersSent: Record<string, string>; headersReceived: Record<string, string>;
  requestBody?: any; responseBody?: any;
  phase: 'initial-request' | '402-challenge' | 'facilitator-settlement' | 'authenticated-delivery';
}
export const HTTP_PACKET_LOGS: HttpLogEntry[] = [];
export const CAIP2_NETWORKS = {
  mainnet: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
  testnet: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
};
export const USDC_ASA_IDS = { mainnet: 31566704, testnet: 10458941 };
export const GLOBAL_CHALLENGE_TAG = 'x402-global-challenge';
interface ExecutionResult {
  success: boolean; http402Challenge: X402Challenge | null;
  transaction: AlgorandTransaction | null; payload: any; error?: string;
}
const config = (import.meta as any).env || {};
const apiBase = config.VITE_API_BASE_URL || '';

async function requestChallenge(endpoint: string, method: string, wallet: WalletState, requestBody?: unknown): Promise<ExecutionResult> {
  let url: string;
  try {
    if (['fleek', 'ipfs'].includes(config.VITE_HOSTING_TARGET) && endpoint.startsWith('/') && !apiBase) throw new Error('Configure VITE_API_BASE_URL for the Fleek frontend');
    url = resolveApiEndpoint(endpoint, apiBase);
  } catch (error: any) {
    return { success: false, http402Challenge: null, transaction: null, payload: null, error: error.message };
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (requestBody !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const response = await fetch(url, { method, headers, signal: AbortSignal.timeout(15000),
      ...(requestBody === undefined ? {} : { body: JSON.stringify(requestBody) }) });
    const payload = await response.json().catch(() => null);
    HTTP_PACKET_LOGS.unshift({
      id: `request-${Date.now()}`, timestamp: new Date().toISOString(), method, url,
      status: response.status, statusText: response.statusText, headersSent: headers,
      headersReceived: Object.fromEntries(response.headers.entries()), requestBody, responseBody: payload,
      phase: response.status === 402 ? '402-challenge' : 'initial-request',
    });
    if (HTTP_PACKET_LOGS.length > 50) HTTP_PACKET_LOGS.length = 50;
    // Payment remains disabled until a real wallet-signed paymentGroup is bound
    // to a persisted challenge, settled, and consumed by the server exactly once.
    return { success: false, http402Challenge: null, transaction: null, payload,
      error: response.status === 402
        ? 'Payment required. Wallet signing and verified settlement are not integrated yet. No payment was sent.'
        : response.ok ? 'Response received. Paid execution was not verified; no transaction was recorded.'
        : typeof payload?.error === 'string' ? payload.error : `Service returned HTTP ${response.status}` };
  } catch {
    return { success: false, http402Challenge: null, transaction: null, payload: null,
      error: 'API unavailable. Check the backend URL and network connection.' };
  }
}
export function executeShorOrchestratorTask(userGoal: string, budgetUsdc: number, wallet: WalletState,
  _pqcKey: PqcKeyPair, _onTxCreated?: (tx: AlgorandTransaction) => void): Promise<ExecutionResult> {
  return requestChallenge('/api/v1/shor/execute', 'POST', wallet, { goal: userGoal, budgetUsdc, network: wallet.network });
}
export function executeX402ServiceRequest(service: PaidService, wallet: WalletState,
  _pqcKey: PqcKeyPair, _onTxCreated?: (tx: AlgorandTransaction) => void): Promise<ExecutionResult> {
  return requestChallenge(service.endpoint, 'GET', wallet);
}
