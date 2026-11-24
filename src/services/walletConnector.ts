import { isValidAddress } from 'algosdk';
import { NETWORKS } from '../config/networks.mjs';
type Network = 'algorand-testnet' | 'algorand-mainnet';
const STORAGE_KEY = 'shor_lute_wallet_pubkey'; // legacy address is watch-only
export const isValidAlgorandAddress = (address: string) => isValidAddress(address);
export function getSavedLutePublicKey() { try { const value = localStorage.getItem(STORAGE_KEY); return value && isValidAddress(value) ? value : null; } catch { return null; } }
export function saveLutePublicKey(address: string) { if (!isValidAddress(address)) throw new Error('Invalid Algorand checksum'); try { localStorage.setItem(STORAGE_KEY, address); } catch { /* storage optional */ } }
export function clearSavedLutePublicKey() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage optional */ } }
export type WalletSession = { status: 'disconnected' | 'watching' | 'connecting' | 'connected' | 'error'; address: string; network: Network; message: string; ownershipProven: false };
export interface WalletAdapter {
  connect(): Promise<string[]>; reconnectSession(): Promise<string[]>; disconnect(): Promise<void>;
  dispose?(): void; on?(event: any, handler: any): (() => void);
  connector?: { on(event: string, handler: (...args: any[]) => void): void; chainId?: number } | null;
}
export class WalletController {
  state: WalletSession;
  private adapter: WalletAdapter | null = null;
  private generation = 0;
  private listeners: (() => void)[] = [];
  private readonly changed: (state: WalletSession) => void;
  private readonly factory: (network: Network) => Promise<WalletAdapter>;
  constructor(network: Network = 'algorand-testnet', changed: (state: WalletSession) => void = () => {}, factory: (network: Network) => Promise<WalletAdapter> = async n => {
    const { PeraWalletConnect } = await import('@perawallet/connect');
    return new PeraWalletConnect({ chainId: NETWORKS[n].chainId as 416001 | 416002 });
  }) { this.changed = changed; this.factory = factory; this.state = { status: 'disconnected', address: '', network, message: 'Wallet disconnected', ownershipProven: false }; }
  private update(patch: Partial<WalletSession>) { this.state = { ...this.state, ...patch }; this.changed(this.state); }
  watch(address: string) {
    if (!isValidAddress(address)) throw new Error('Invalid Algorand address checksum');
    if (this.adapter || this.state.status === 'connecting') throw new Error('Disconnect wallet before watching an address');
    saveLutePublicKey(address);
    this.update({ status: 'watching', address, message: 'Address viewing only; no wallet session or signing authority' });
  }
  async connect(restore = false) {
    const generation = ++this.generation;
    this.update({ status: 'connecting', address: '', message: restore ? 'Restoring wallet session' : 'Approve the Pera connection or scan its QR code' });
    try {
      const adapter = this.adapter || await this.factory(this.state.network);
      if (generation !== this.generation) { adapter.dispose?.(); return; }
      this.adapter = adapter;
      const accounts = await (restore ? adapter.reconnectSession() : adapter.connect());
      if (generation !== this.generation) return;
      if (!accounts.length || accounts.some(a => !isValidAddress(a))) throw new Error('No valid wallet account returned');
      if (adapter.connector?.chainId && adapter.connector.chainId !== NETWORKS[this.state.network].chainId) throw new Error('Wrong wallet network');
      this.listeners.forEach(stop => stop()); this.listeners = [];
      if (adapter.on) {
        this.listeners.push(adapter.on('disconnect', () => { void this.disconnect(); }));
        this.listeners.push(adapter.on('networkChanged', () => { void this.disconnect('Wallet network changed; reconnect on the selected network'); }));
      }
      adapter.connector?.on('session_update', () => { void this.disconnect('Wallet account or network changed; reconnect to review it'); });
      this.update({ status: 'connected', address: accounts[0], message: 'Pera session connected; ownership and transaction consent are separate' });
    } catch (error) {
      if (generation !== this.generation) return;
      await this.disconnect();
      this.update({ status: 'error', message: error instanceof Error ? error.message : 'Wallet connection cancelled or unavailable' });
    }
  }
  async disconnect(message = 'Wallet disconnected') {
    ++this.generation;
    this.listeners.forEach(stop => stop()); this.listeners = [];
    const adapter = this.adapter; this.adapter = null;
    this.update({ status: 'disconnected', address: '', message });
    try { await adapter?.disconnect(); } catch { /* local authority already removed */ }
    adapter?.dispose?.();
  }
  async changeNetwork(network: Network) { if (!NETWORKS[network]) throw new Error('Unsupported wallet network'); await this.disconnect(); this.update({ network }); }
}
