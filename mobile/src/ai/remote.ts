import type { Lang } from '../engine';
import { signRequest } from './identity';
import { modelReply } from './assistant';

const configured = process.env.EXPO_PUBLIC_ANTIGOLPE_ASSISTANT_URL;

function endpoint() {
  try {
    const url = new URL(configured || '');
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/assistant') return url.href;
  } catch { /* Optional backend. */ }
  return undefined;
}
export const remoteAvailable = Boolean(endpoint());

export async function remoteReply(text: string, lang: Lang, consent: boolean) {
  const url = endpoint();
  if (!consent || !url || !text.trim() || text.length > 2400) throw new Error('unavailable');
  const body = JSON.stringify({ consent: true, text });
  const proof = await signRequest(body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { method: 'POST', body, signal: controller.signal, redirect: 'error', headers: {
      'Content-Type': 'application/json', 'X-AG-Time': proof.time, 'X-AG-Nonce': proof.nonce,
      'X-AG-Key': proof.publicKey, 'X-AG-Signature': proof.signature,
    } });
    if (!response.ok) throw new Error('unavailable');
    return modelReply(await response.json(), text, lang);
  } finally { clearTimeout(timeout); }
}
