import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildHtmlReport } from './report';
import type { AnalysisResult, Lang } from './engine';

interface PdfDependencies {
  isAvailable: () => Promise<boolean>;
  print: (html: string) => Promise<{ uri: string }>;
  share: (uri: string) => Promise<void>;
}
const native: PdfDependencies = {
  isAvailable: () => Sharing.isAvailableAsync(),
  print: html => Print.printToFileAsync({ html }),
  share: uri => Sharing.shareAsync(uri, { mimeType: 'application/pdf' }),
};
/** Print creates a local temporary PDF; sharing happens only by user request. */
export async function exportPdf(result: AnalysisResult, lang: Lang, deps: PdfDependencies = native): Promise<void> {
  if (!await deps.isAvailable()) throw new Error('sharing-unavailable');
  const { uri } = await deps.print(buildHtmlReport(result, lang));
  await deps.share(uri);
}
