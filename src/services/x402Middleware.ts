import type { Express } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { ALGORAND_MAINNET_CAIP2, USDC_MAINNET_ASA_ID } from '@x402/avm';

export const SHOR_PAY_TO = process.env.X402_PAY_TO || 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
export const SHOR_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.goplausible.xyz';
export const SHOR_NETWORK = ALGORAND_MAINNET_CAIP2 as `algorand:${string}`;
export const SHOR_USDC_ASSET = USDC_MAINNET_ASA_ID;

/**
 * Install the official x402 V2 resource-server middleware.
 * Verification and settlement are delegated to the configured facilitator;
 * this application does not infer payment validity from a transaction-id header.
 */
export function installShorX402(app: Express): void {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: SHOR_FACILITATOR_URL,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register(SHOR_NETWORK, new ExactAvmScheme());

  const routes = {
    'POST /api/v1/shor/execute': {
      accepts: {
        scheme: 'exact' as const,
        network: SHOR_NETWORK,
        payTo: SHOR_PAY_TO,
        price: '$0.005',
        extra: {
          asset: SHOR_USDC_ASSET,
        },
        maxTimeoutSeconds: 60,
      },
      description: 'SHOR autonomous orchestration endpoint paid with Algorand USDC through x402 V2.',
      mimeType: 'application/json',
    },
  };

  app.use(paymentMiddleware(routes, resourceServer));
}
