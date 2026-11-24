import { classifyQrContent, parsePixBrCode } from '../src/qr';
// A published EMV/Pix example, followed by a CRC computed independently in the test.
function crc(text: string) {
 let value=0xffff;
 for(const byte of Array.from(text, c => c.charCodeAt(0))) { value ^= byte << 8; for(let i=0;i<8;i++) value = ((value & 0x8000) ? (value << 1) ^ 0x1021 : value << 1) & 0xffff; }
 return value.toString(16).toUpperCase().padStart(4,'0');
}
test('Pix GUI inside another merchant account template and CRC',()=>{
 const prefix='000201'+'2730'+'0014br.gov.bcb.pix'+'0108test-key'+'5303986'+'540410.0'+'5802BR'+'5904JOSE'+'6003RIO'+'6304';
 const payload=prefix+crc(prefix);
 const result=classifyQrContent(payload);
 expect(result.kind).toBe('pix'); expect(result.pix?.merchantName).toBe('JOSE'); expect(result.pix?.amount).toBe('10.0'); expect(result.pix?.crcValid).toBe(true);
 expect(parsePixBrCode(prefix+'0000').crcValid).toBe(false);
});
test('text containing Pix GUI outside account template is not Pix',()=>{
 expect(classifyQrContent('00020159014br.gov.bcb.pix').kind).toBe('other');
});
