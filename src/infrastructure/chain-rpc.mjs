// Chain-specific capabilities. Connecting an RPC does not connect a wallet.
export const EVM_TESTNETS = Object.freeze({
  'base-sepolia': { caip2: 'eip155:84532', chainIdHex: '0x14a34' },
  'ethereum-sepolia': { caip2: 'eip155:11155111', chainIdHex: '0xaa36a7' },
});
export async function inspectQuickNode({ url = process.env.QUICKNODE_EVM_RPC_URL,
  chain = process.env.EVM_CHAIN || 'base-sepolia', fetchFn = fetch } = {}) {
  if (!url) throw new Error('QUICKNODE_EVM_RPC_URL is not configured');
  if (!EVM_TESTNETS[chain]) throw new Error('Unsupported EVM testnet');
  let endpoint;
  try { endpoint = new URL(url); } catch { throw new Error('Invalid QuickNode URL'); }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
      !/^(?:[a-z0-9-]+\.)+(?:quiknode\.pro|quicknode\.com)$/.test(endpoint.hostname)) throw new Error('Expected a private HTTPS QuickNode endpoint');
  let reply;
  try {
    const response = await fetchFn(endpoint, { method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error();
    reply = await response.json();
  } catch { throw new Error('QuickNode RPC unavailable'); }
  if (reply?.jsonrpc !== '2.0' || reply.id !== 1 || reply.error ||
      typeof reply.result !== 'string' || reply.result.toLowerCase() !== EVM_TESTNETS[chain].chainIdHex) {
    throw new Error('QuickNode chain identity mismatch');
  }
  return { chain, caip2: EVM_TESTNETS[chain].caip2, scope: 'rpc-chain-identity-only' };
}
