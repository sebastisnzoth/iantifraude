/**
 * Clasificación de contenido QR y análisis de códigos Pix (BR Code).
 * Nunca abre enlaces ni realiza pagos. Solo interpreta datos reales.
 */

export type QrKind = 'url' | 'text' | 'pix' | 'other';

export interface QrClassification {
  kind: QrKind;
  raw: string;
  url?: string;
  pix?: PixInfo;
}

export interface PixInfo {
  isBrCode: boolean;
  merchantName?: string;
  merchantCity?: string;
  amount?: string;
  currency?: string;
  txid?: string;
  country?: string;
  gui?: string;
  crcValid?: boolean;
  parseable: boolean;
}

function parseTlv(payload: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenStr)) break;
    const len = parseInt(lenStr, 10);
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length < len) break;
    map.set(id, value);
    i += 4 + len;
  }
  return map;
}

function parseSubTlv(value: string): Map<string, string> {
  return parseTlv(value);
}

function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  // CRC-16 is calculated over UTF-8 bytes, not JavaScript UTF-16 units.
  const bytes = encodeURIComponent(input).replace(/%([0-9A-F]{2})|([^%])/g, (_match, hex, char) =>
    String.fromCharCode(hex ? parseInt(hex, 16) : char.charCodeAt(0)));
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function parsePixBrCode(raw: string): PixInfo {
  const payload = raw.trim();
  const isBrCode = payload.startsWith('000201');
  if (!isBrCode) return { isBrCode: false, parseable: false };
  const fields = parseTlv(payload);
  const info: PixInfo = { isBrCode: true, parseable: fields.size >= 3 };
  if (fields.has('59')) info.merchantName = fields.get('59');
  if (fields.has('60')) info.merchantCity = fields.get('60');
  if (fields.has('54')) info.amount = fields.get('54');
  if (fields.has('53')) info.currency = fields.get('53') === '986' ? 'BRL' : fields.get('53');
  if (fields.has('58')) info.country = fields.get('58');
  // Merchant account information may occupy any template from 26 to 51.
  for (let id = 26; id <= 51; id++) {
    const account = fields.get(String(id));
    if (!account) continue;
    const gui = parseSubTlv(account).get('00');
    if (gui?.toLowerCase() === 'br.gov.bcb.pix') { info.gui = gui; break; }
  }
  const additional = fields.get('62');
  if (additional) {
    const sub = parseSubTlv(additional);
    if (sub.has('05')) info.txid = sub.get('05');
  }
  const crc = fields.get('63');
  if (crc && /^[0-9a-f]{4}$/i.test(crc) && /6304[0-9a-f]{4}$/i.test(payload)) {
    const withoutCrc = payload.slice(0, -4);
    try {
      info.crcValid = crc16Ccitt(withoutCrc) === crc.toUpperCase();
    } catch {
      // Malformed Unicode cannot be checked reliably; do not report a CRC result.
    }
  }
  return info;
}

export function classifyQrContent(raw: string): QrClassification {
  const value = String(raw ?? '').trim();
  if (!value) return { kind: 'other', raw: value };
  const pix = parsePixBrCode(value);
  if (pix.isBrCode && pix.gui) return { kind: 'pix', raw: value, pix };
  if (pix.isBrCode) return { kind: 'other', raw: value };
  if (/^https?:\/\/[^\s]+$/i.test(value)) {
    try {
      const u = new URL(value);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return { kind: 'url', raw: value, url: value };
      }
    } catch {
      /* cae a texto */
    }
  }
  if (/^www\.[^\s]+\.[^\s]+$/i.test(value)) {
    return { kind: 'url', raw: value, url: 'https://' + value };
  }
  // Texto con URL incrustada
  if (/https?:\/\//i.test(value)) return { kind: 'text', raw: value };
  return { kind: 'text', raw: value };
}
