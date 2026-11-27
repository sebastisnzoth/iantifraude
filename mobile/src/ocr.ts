import { Platform } from 'react-native';
import { LIMITS, sanitizeText, validateImageSize } from './validation';

export type OcrError = 'unsupported' | 'size' | 'image' | 'recognition';
export class OcrFailure extends Error {
  constructor(public code: OcrError) { super(code); }
}
export interface OcrAsset { uri: string; fileSize?: number; width: number; height: number }
const MAX_PIXELS = 24_000_000;

/** Only local picker assets are accepted. Unknown file sizes fail closed. */
export function validateOcrAsset(asset: OcrAsset): void {
  if (!/^(file|content):\/\//i.test(asset.uri)) throw new OcrFailure('image');
  if (!validateImageSize(asset.fileSize ?? 0)) throw new OcrFailure('size');
  if (!Number.isFinite(asset.width) || !Number.isFinite(asset.height) || asset.width <= 0 || asset.height <= 0 || asset.width * asset.height > MAX_PIXELS) throw new OcrFailure('image');
}

/** Native-only on-device OCR. The native model is bundled on Android. */
export async function recognizeScreenshot(asset: OcrAsset): Promise<string> {
  validateOcrAsset(asset);
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new OcrFailure('unsupported');
  try {
    // Lazy import permits Expo Go / web to fall back to manual input.
    const ocr = require('expo-mlkit-ocr') as typeof import('expo-mlkit-ocr');
    if (!ocr.isSupported()) throw new OcrFailure('unsupported');
    const result = await ocr.recognizeText(asset.uri);
    return sanitizeText(result.text).slice(0, LIMITS.text);
  } catch (error) {
    if (error instanceof OcrFailure) throw error;
    throw new OcrFailure('recognition');
  }
}
