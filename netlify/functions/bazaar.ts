import type { Handler } from '@netlify/functions';
import discovery from '../../x402-bazaar.json' with { type: 'json' };
export const handler: Handler = async event => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: { ...headers, Allow: 'GET, OPTIONS' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  return { statusCode: 200, headers, body: JSON.stringify(discovery) };
};
