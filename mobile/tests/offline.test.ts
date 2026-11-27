import { analyzeText } from '../src/engine';
import { classifyQrContent } from '../src/qr';
import { buildHtmlReport } from '../src/report';

test('local engine, QR classification and report rendering do not call fetch', () => {
  const spy = jest.spyOn(globalThis, 'fetch');
  try {
    const result = analyzeText('Urgente: envíe su contraseña en https://example.com');
    expect(result.signals.length).toBeGreaterThan(0);
    expect(classifyQrContent('https://example.com').kind).toBe('url');
    expect(buildHtmlReport(result, 'es')).toContain('heurística');
    expect(spy).not.toHaveBeenCalled();
  } finally { spy.mockRestore(); }
});
