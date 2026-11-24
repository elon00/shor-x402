export function infrastructureHealth(env = process.env) {
  return {
    status: 'ok', scope: 'process-health-only', service: 'SHOR x402',
    timestamp: new Date().toISOString(), productionReady: false,
    payments: { enabled: false, status: 'SECURITY_HOLD' },
    network: { selected: 'algorand-testnet', consensusStatus: 'not-checked' },
    ipfs: { configured: !!env.IPFS_RPC_URL && (env.SHOR_STORAGE_API_KEY?.length || 0) >= 32,
      liveStatus: 'not-checked' },
    quickNode: { configured: !!env.QUICKNODE_EVM_RPC_URL, liveStatus: 'not-checked' },
    ai: { configured: !!env.GEMINI_API_KEY, liveStatus: 'not-checked' },
  };
}
