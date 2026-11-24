import { analyzeText } from '../src/engine';
import { classifyQrContent, parsePixBrCode } from '../src/qr';
import { detectLang } from '../src/i18n';
import { sanitizeText, validateImageSize } from '../src/validation';
import { buildTextReport, buildHtmlReport } from '../src/report';

test('normal message and isolated Pix do not indicate high risk',()=>{expect(analyzeText('Hola, nos vemos mañana').level).toBe(0);expect(analyzeText('Pix').level).not.toBe(2);});
test.each(['URGENTE tu cuenta será bloqueada, envía tu contraseña','URGENTE sua conta está bloqueada, informe sua senha','URGENT account blocked send your password'])('multilingual phishing: %s',text=>{expect(analyzeText(text).level).toBe(2);});
test('Pix with payment pressure produces signals',()=>{const r=analyzeText('Pix urgente transferência para liberar prêmio');expect(r.signals.length).toBeGreaterThan(1);});
test('empty and long input',()=>{expect(analyzeText('').insufficient).toBe(true);expect(sanitizeText('x'.repeat(30000)).length).toBe(20000);});
test('URLs with hidden destination and malformed URLs do not throw',()=>{expect(analyzeText('https://bank.com@evil.com/login').signals.length).toBeGreaterThan(0); expect(()=>analyzeText('https://%broken')).not.toThrow();});
test('QR classifies link and text without opening it',()=>{expect(classifyQrContent('https://example.com').kind).toBe('url');expect(classifyQrContent('hello').kind).toBe('text');expect(parsePixBrCode('not a code').parseable).toBe(false);});
test('image limits and language detection',()=>{expect(validateImageSize(11*1024*1024)).toBe(false);expect(detectLang('pt-BR')).toBe('pt');expect(detectLang('en-US')).toBe('en');});
test('report contains limitation and score',()=>{let r=analyzeText('URGENTE password');expect(buildTextReport(r,'en','message')).toContain('does not guarantee');expect(buildHtmlReport(r,'en')).toContain('Heuristic');});
