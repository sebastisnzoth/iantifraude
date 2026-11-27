import type { AnalysisResult, Lang, Signal } from '../engine';
import type { FinancialSignal } from './financial';
import { CERT_SOURCE, type Reputation } from './reputation';

export const detailStrings = {
  es: {
    tools: 'Verificación de dominios', check: 'Consultar lista de CERT Polska', checking: 'Consultando…',
    about: 'Descarga la lista pública y compara los dominios en este dispositivo. Solo se conecta a CERT Polska.',
    error: 'La lista no está disponible. Podés volver a intentar en un minuto.',
    reviewed: 'Dominios revisados', matched: 'Coincidencias', scope: 'La lista tiene cobertura parcial. Un dominio ausente puede ser peligroso.',
    hit: 'Dominio incluido en la lista de advertencias', hitDetail: 'Un dominio del mensaje o su dominio superior figura en la lista de CERT Polska. Evitá el enlace y verificá por un canal oficial.',
    date: 'Fecha del análisis', source: 'Fuentes', data: 'Análisis heurístico local. No autentica pagos, identidades ni destinatarios.',
    print: 'Imprimir informe Pro',
  },
  pt: {
    tools: 'Verificação de domínios', check: 'Consultar lista do CERT Polska', checking: 'Consultando…',
    about: 'Baixa a lista pública e compara os domínios neste aparelho. Conecta-se apenas ao CERT Polska.',
    error: 'A lista está indisponível. Tente novamente em um minuto.',
    reviewed: 'Domínios verificados', matched: 'Correspondências', scope: 'A cobertura da lista é parcial. Um domínio ausente pode ser perigoso.',
    hit: 'Domínio presente na lista de alertas', hitDetail: 'Um domínio da mensagem ou seu domínio superior consta na lista do CERT Polska. Evite o link e confirme por um canal oficial.',
    date: 'Data da análise', source: 'Fontes', data: 'Análise heurística local. Não autentica pagamentos, identidades nem destinatários.',
    print: 'Imprimir relatório Pro',
  },
  en: {
    tools: 'Domain checks', check: 'Check CERT Polska warning list', checking: 'Checking…',
    about: 'Downloads the public list and checks domains on your device. Connects only to CERT Polska.',
    error: 'The list is unavailable. Try again in a minute.',
    reviewed: 'Domains checked', matched: 'Matches', scope: 'The list has partial coverage. An unlisted domain can still be dangerous.',
    hit: 'Domain on the warning list', hitDetail: 'A domain in the message or its parent appears on the CERT Polska warning list. Avoid the link and verify independently.',
    date: 'Analysis date', source: 'Sources', data: 'Local heuristic analysis. It cannot authenticate payments, identities or recipients.',
    print: 'Print Pro report',
  },
};

export interface ProReport {
  date: string;
  financial: FinancialSignal[];
  reputation?: Reputation;
}

export function proSources(details: ProReport): string[] {
  const sources = new Set(details.financial.map(s => s.source));
  if (details.reputation) sources.add(CERT_SOURCE);
  return [...sources];
}

export function withProEvidence(result: AnalysisResult, details?: ProReport): AnalysisResult {
  if (!details) return result;
  const signals: Signal[] = [...details.financial];
  if (details.reputation?.listed.length) {
    const langs = (key: 'hit' | 'hitDetail'): Record<Lang, string> => ({
      en: detailStrings.en[key], es: detailStrings.es[key], pt: detailStrings.pt[key],
    });
    signals.unshift({ id: 'cert_warning_list', weight: 5, category: 'link', label: langs('hit'), explanation: langs('hitDetail') });
  }
  if (!signals.length) return result;
  // Compound financial patterns can overlap Free rules. Don't double count them.
  const score = Math.max(result.score, ...signals.map(s => s.weight * 12));
  const recs = new Set(result.recommendations);
  if (details.financial.length) recs.add('payment');
  if (details.reputation?.listed.length) recs.add('link');
  const topBase = Math.max(0, ...result.signals.map(s => s.weight));
  const top = signals.reduce((a, b) => a.weight >= b.weight ? a : b);
  return { ...result, signals: [...signals, ...result.signals], score,
    level: score >= 60 ? 2 : score >= 24 ? 1 : 0, recommendations: [...recs],
    category: top.weight >= topBase ? top.category : result.category };
}

export function reputationSummary(rep: Reputation, lang: Lang): string {
  const s = detailStrings[lang];
  return `${s.reviewed}: ${rep.checked} · ${s.matched}: ${rep.listed.length}\nCERT Polska · ${rep.checkedAt}\n${s.scope}`;
}
