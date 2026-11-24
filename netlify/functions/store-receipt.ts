import type { Handler } from '@netlify/functions';
import { handleReceiptStorage } from '../../src/infrastructure/storage-handler.mjs';
export const handler: Handler = async event => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { ...headers, Allow: 'POST' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  if ((event.body?.length || 0) > 16384 || event.isBase64Encoded) return { statusCode: 413, headers, body: JSON.stringify({ error: 'Receipt body too large or unsupported encoding' }) };
  let body;
  try { body = JSON.parse(event.body || ''); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const result = await handleReceiptStorage({ authorization: event.headers.authorization, body });
  return { statusCode: result.status, headers, body: JSON.stringify(result.body) };
};
