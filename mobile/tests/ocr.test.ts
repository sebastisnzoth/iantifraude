import { recognizeScreenshot, validateOcrAsset, OcrFailure } from '../src/ocr';
import { Platform } from 'react-native';
const asset = { uri: 'file:///tmp/image.jpg', fileSize: 1024, width: 100, height: 100 };
const mockRecognize = jest.fn(async () => ({ text: 'hola\r\nmundo\u0000', blocks: [] }));
const mockSupport = jest.fn(() => true);
jest.mock('expo-mlkit-ocr', () => ({ recognizeText: mockRecognize, isSupported: mockSupport }));
afterEach(() => jest.clearAllMocks());
test('validates local asset size, dimensions and scheme without reading files', () => {
 expect(() => validateOcrAsset(asset)).not.toThrow();
 for (const invalid of [ {...asset, uri:'https://example.org/a.jpg'}, {...asset, fileSize:undefined}, {...asset,fileSize:11*1024*1024}, {...asset,width:10000,height:10000} ]) expect(() => validateOcrAsset(invalid)).toThrow(OcrFailure);
});
test('runs local OCR and sanitizes editable text', async () => {
 const before=Platform.OS; Platform.OS='android';
 try { expect(await recognizeScreenshot(asset)).toBe('hola\nmundo'); expect(mockRecognize).toHaveBeenCalledWith(asset.uri); }
 finally { Platform.OS=before; }
});
test('native failure, unavailable model, and web fall back without sending input', async () => {
 const before=Platform.OS;
 try { Platform.OS='android'; mockSupport.mockReturnValueOnce(false); await expect(recognizeScreenshot(asset)).rejects.toMatchObject({code:'unsupported'});
 mockRecognize.mockRejectedValueOnce(new Error('native failed')); await expect(recognizeScreenshot(asset)).rejects.toMatchObject({code:'recognition'});
 Platform.OS='web'; await expect(recognizeScreenshot(asset)).rejects.toMatchObject({code:'unsupported'}); }
 finally { Platform.OS=before; }
});
