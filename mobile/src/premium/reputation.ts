// The fixed public feed is identical for every user. Comparisons happen locally.
export const CERT_SOURCE = 'https://cert.pl/en/warning-list/';
export const CERT_FEED = 'https://hole.cert.pl/domains/v2/domains.txt';
const TTL = 5 * 60_000;
const RETRY_AFTER = 60_000;
const MAX_BYTES = 8 * 1024 * 1024;

export function analysisHosts(text: string, linkMode: boolean): string[] {
  const value = text.slice(0, 20000).trim();
  const candidates: string[] = value.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? [];
  if (!candidates.length && linkMode && !/\s/.test(value) && !value.includes('://')) candidates.push('https://' + value);
  const hosts = new Set<string>();
  for (const raw of candidates.slice(0, 30)) {
    try {
      const host = new URL(raw.replace(/[.,;!?]+$/, '')).hostname.toLowerCase().replace(/\.$/, '');
      if (host.includes('.') && host.length <= 253) hosts.add(host);
    } catch { /* A malformed URL cannot be checked against domain listings. */ }
  }
  return [...hosts];
}

export function createReputationLookup(request: typeof fetch = fetch, now = Date.now) {
  let snapshot: { hosts: Set<string>; at: number } | undefined;
  let pending: Promise<void> | undefined;
  let retryAt = 0;
  async function refresh() {
    if (now() < retryAt) throw new Error('feed-cooldown');
    retryAt = now() + RETRY_AFTER;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await request(CERT_FEED, { signal: ac.signal, credentials: 'omit', redirect: 'error' });
      if (!r.ok || Number(r.headers.get('content-length')) > MAX_BYTES) throw new Error('feed-unavailable');
      const body = await r.text();
      if (body.length > MAX_BYTES) throw new Error('feed-size');
      const domains = new Set<string>();
      for (const line of body.split('\n')) {
        const host = line.trim().toLowerCase();
        if (host.length <= 253 && /^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(host)) domains.add(host);
      }
      if (domains.size < 1) throw new Error('feed-empty');
      snapshot = { hosts: domains, at: now() };
    } finally { clearTimeout(timer); }
  }
  return async (hosts: readonly string[]) => {
    if (!snapshot || now() - snapshot.at >= TTL) {
      pending ??= refresh().finally(() => { pending = undefined; });
      await pending;
    }
    const feed = snapshot!;
    const listed = hosts.filter(host => {
      const labels = host.toLowerCase().split('.');
      for (let i = 0; i < labels.length - 1; i++) {
        if (feed.hosts.has(labels.slice(i).join('.'))) return true;
      }
      return false;
    });
    return { checked: hosts.length, listed, checkedAt: new Date(feed.at).toISOString() };
  };
}

export const checkReputation = createReputationLookup();
export type Reputation = Awaited<ReturnType<typeof checkReputation>>;
