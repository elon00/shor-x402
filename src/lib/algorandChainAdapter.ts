/**
 * SHOR x402 — Algorand Chain-Specific Adapter & Technologies
 *
 * Implements native Algorand protocol standards:
 * - Algorand Virtual Machine (AVM) atomic transaction composition
 * - Algorand Standard Asset (ASA) Circle USDC (MainNet 31566704, TestNet 10458941)
 * - Official Coinbase / GoPlausible x402 V2 Algorand Exact Scheme
 * - AlgoKit Lora & Allo ecosystem explorer integrations
 * - AlgoNode / Nodely resilient node & indexer RPC clients
 */

import algosdk from 'algosdk';

export type AlgorandNetworkKey = 'mainnet' | 'testnet' | 'localnet';

export interface AlgorandChainConfig {
  key: AlgorandNetworkKey;
  caip2: string;
  caip2Short: string;
  algodUrl: string;
  indexerUrl: string;
  genesisId: string;
  usdcAssetId: number;
  usdcDecimals: number;
  usdcUnit: string;
  defaultFeePayer: string;
  facilitatorUrl: string;
  explorerLora: string;
  explorerAllo: string;
}

export const ALGORAND_CHAINS: Record<AlgorandNetworkKey, AlgorandChainConfig> = {
  testnet: {
    key: 'testnet',
    caip2: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    caip2Short: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
    algodUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    genesisId: 'testnet-v1.0',
    usdcAssetId: 10458941,
    usdcDecimals: 6,
    usdcUnit: 'USDC',
    defaultFeePayer: 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA',
    facilitatorUrl: 'https://facilitator.goplausible.xyz',
    explorerLora: 'https://lora.algokit.io/testnet',
    explorerAllo: 'https://testnet.allo.info',
  },
  mainnet: {
    key: 'mainnet',
    caip2: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
    caip2Short: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
    algodUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud',
    genesisId: 'mainnet-v1.0',
    usdcAssetId: 31566704,
    usdcDecimals: 6,
    usdcUnit: 'USDC',
    defaultFeePayer: 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA',
    facilitatorUrl: 'https://facilitator.goplausible.xyz',
    explorerLora: 'https://lora.algokit.io/mainnet',
    explorerAllo: 'https://allo.info',
  },
  localnet: {
    key: 'localnet',
    caip2: 'algorand:localnet',
    caip2Short: 'algorand:localnet',
    algodUrl: 'http://localhost:4001',
    indexerUrl: 'http://localhost:8980',
    genesisId: 'devnet-v1.0',
    usdcAssetId: 10458941,
    usdcDecimals: 6,
    usdcUnit: 'USDC',
    defaultFeePayer: '',
    facilitatorUrl: 'http://localhost:8080',
    explorerLora: 'https://lora.algokit.io/localnet',
    explorerAllo: 'http://localhost:3000',
  },
};

/**
 * Creates an algosdk Algodv2 client for the specified chain.
 */
export function getAlgodClient(network: AlgorandNetworkKey = 'testnet'): algosdk.Algodv2 {
  const config = ALGORAND_CHAINS[network];
  return new algosdk.Algodv2('', config.algodUrl, '');
}

/**
 * Creates an algosdk Indexer client for the specified chain.
 */
export function getIndexerClient(network: AlgorandNetworkKey = 'testnet'): algosdk.Indexer {
  const config = ALGORAND_CHAINS[network];
  return new algosdk.Indexer('', config.indexerUrl, '');
}

/**
 * Chain Explorer Deep-Links (AlgoKit Lora & Allo)
 */
export function getExplorerLinks(txId: string, network: AlgorandNetworkKey = 'testnet') {
  const config = ALGORAND_CHAINS[network];
  return {
    lora: `${config.explorerLora}/transaction/${txId}`,
    allo: `${config.explorerAllo}/tx/${txId}`,
  };
}

export function getAccountExplorerLinks(address: string, network: AlgorandNetworkKey = 'testnet') {
  const config = ALGORAND_CHAINS[network];
  return {
    lora: `${config.explorerLora}/account/${address}`,
    allo: `${config.explorerAllo}/account/${address}`,
  };
}

/**
 * Reads real on-chain account balance and ASA holding details.
 */
export async function getAccountHolding(
  algod: algosdk.Algodv2,
  address: string,
  assetId: number
): Promise<{
  algoMicro: number;
  algoBalance: number;
  usdcMicro: number;
  usdcBalance: number;
  isOptedIn: boolean;
}> {
  const info = await algod.accountInformation(address).do();
  const algoMicro = Number(info.amount || 0);
  const assets: any[] = info.assets || [];

  const targetAsset = assets.find(
    (a) => Number(a.assetId ?? a['asset-id']) === assetId
  );

  const usdcMicro = targetAsset ? Number(targetAsset.amount || 0) : 0;

  return {
    algoMicro,
    algoBalance: algoMicro / 1e6,
    usdcMicro,
    usdcBalance: usdcMicro / 1e6,
    isOptedIn: !!targetAsset,
  };
}

/**
 * Builds an official x402 Algorand ASA transfer transaction.
 * Follows the Coinbase/GoPlausible scheme exact for Algorand.
 */
export async function buildX402AssetTransferTxn(
  algod: algosdk.Algodv2,
  params: {
    sender: string;
    recipient: string;
    amountMicro: number;
    assetId: number;
    challengeHash?: string;
  }
): Promise<algosdk.Transaction> {
  const suggestedParams = await algod.getTransactionParams().do();

  const note = params.challengeHash
    ? new TextEncoder().encode(`x402:${params.challengeHash}`)
    : undefined;

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: params.sender,
    receiver: params.recipient,
    amount: params.amountMicro,
    assetIndex: params.assetId,
    note,
    suggestedParams,
  });
}

/**
 * Submits signed x402 payment payload to the genuine GoPlausible Facilitator
 * for atomic verification.
 */
export async function verifyWithFacilitator(
  facilitatorUrl: string,
  paymentPayload: {
    x402Version: number;
    scheme: 'exact';
    network: string;
    payload: {
      paymentIndex: number;
      paymentGroup: string[];
    };
  },
  paymentRequirements: {
    scheme: 'exact';
    network: string;
    amount: string;
    payTo: string;
    asset: string;
    maxTimeoutSeconds?: number;
  }
): Promise<{ isValid: boolean; invalidReason?: string }> {
  const res = await fetch(`${facilitatorUrl.replace(/\/$/, '')}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });

  if (!res.ok) {
    return { isValid: false, invalidReason: `HTTP ${res.status}` };
  }

  const data = await res.json();
  return {
    isValid: data.isValid === true,
    invalidReason: data.invalidReason,
  };
}

/**
 * Submits signed x402 payment payload to the genuine GoPlausible Facilitator
 * for on-chain settlement.
 */
export async function settleWithFacilitator(
  facilitatorUrl: string,
  paymentPayload: {
    x402Version: number;
    scheme: 'exact';
    network: string;
    payload: {
      paymentIndex: number;
      paymentGroup: string[];
    };
  },
  paymentRequirements: {
    scheme: 'exact';
    network: string;
    amount: string;
    payTo: string;
    asset: string;
  }
): Promise<{ success: boolean; transaction?: string; errorReason?: string; network?: string }> {
  const res = await fetch(`${facilitatorUrl.replace(/\/$/, '')}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });

  if (!res.ok) {
    return { success: false, errorReason: `HTTP ${res.status}` };
  }

  return await res.json();
}
