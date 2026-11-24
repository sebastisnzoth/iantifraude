/** Validación y sanitización de entradas. Límites estrictos, sin dependencias. */

export const LIMITS = {
  text: 20000,
  imageBytes: 10 * 1024 * 1024, // 10 MB
  historyMax: 50,
} as const;

export function sanitizeText(input: string): string {
  return String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .slice(0, LIMITS.text);
}

export function validateText(input: string): { ok: boolean; error?: 'empty' | 'too_short' } {
  const t = String(input ?? '').trim();
  if (!t) return { ok: false, error: 'empty' };
  if (t.length < 3) return { ok: false, error: 'too_short' };
  return { ok: true };
}

export function validateImageSize(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= LIMITS.imageBytes;
}

export function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}
