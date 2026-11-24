import { CATEGORY_LABEL, RECOMMENDATION_TEXT, type AnalysisResult, type Lang } from './engine';
import { t } from './i18n';

/** Informe en texto plano (copiar / compartir). */
export function buildTextReport(result: AnalysisResult, lang: Lang, typeLabel: string): string {
  const s = t(lang);
  const levelLabel = result.insufficient
    ? s.insufficient
    : result.level === 2 ? s.riskHigh : result.level === 1 ? s.riskMid : s.riskLow;
  const lines: string[] = [
    `${s.appName} — ${s.slogan}`,
    `${s.categoryTitle}: ${result.category ? (CATEGORY_LABEL[result.category]?.[lang] ?? result.category) : '—'}`,
    `${levelLabel} · ${s.heuristicNote} (${result.score}/100)`,
    '',
    s.signalsTitle + ':',
  ];
  if (result.signals.length) {
    for (const sig of result.signals) lines.push(`• ${sig.label[lang]}`);
  } else {
    lines.push(s.noSignals);
  }
  lines.push('', s.recommendationsTitle + ':');
  for (const key of result.recommendations) {
    lines.push(`• ${RECOMMENDATION_TEXT[key]?.[lang] ?? key}`);
  }
  lines.push('', s.disclaimer);
  return lines.join('\n');
}

/** Informe HTML para PDF (expo-print). */
export function buildHtmlReport(result: AnalysisResult, lang: Lang): string {
  const s = t(lang);
  const levelLabel = result.insufficient
    ? s.insufficient
    : result.level === 2 ? s.riskHigh : result.level === 1 ? s.riskMid : s.riskLow;
  const color = result.insufficient ? '#6b7280' : result.level === 2 ? '#dc2626' : result.level === 1 ? '#d97706' : '#08765c';
  const signals = result.signals.length
    ? result.signals.map((sig) => `<li><strong>${sig.label[lang]}</strong><br/><span>${sig.explanation[lang]}</span></li>`).join('')
    : `<li>${s.noSignals}</li>`;
  const recs = result.recommendations
    .map((key) => `<li>${RECOMMENDATION_TEXT[key]?.[lang] ?? key}</li>`)
    .join('');
  const category = result.category ? (CATEGORY_LABEL[result.category]?.[lang] ?? result.category) : '—';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"/>
<title>AntiGolpe AI</title><style>
body{font-family:system-ui,sans-serif;color:#142b27;background:#f4f7f6;margin:0;padding:24px}
.card{background:#fff;border-radius:16px;padding:20px;margin:16px 0;border:1px solid #dce6e2}
h1{color:#08765c;font-size:22px} .risk{font-size:20px;font-weight:800;color:${color}}
li{margin:8px 0;line-height:1.5} .small{font-size:12px;color:#60746d}
</style></head><body>
<h1>◈ ${s.appName} — ${s.slogan}</h1>
<div class="card"><div class="risk">${levelLabel} · ${result.score}/100</div>
<p class="small">${s.heuristicNote}</p>
<p><strong>${s.categoryTitle}:</strong> ${category}</p></div>
<div class="card"><h2>${s.signalsTitle}</h2><ul>${signals}</ul></div>
<div class="card"><h2>${s.recommendationsTitle}</h2><ul>${recs}</ul></div>
<p class="small">${s.disclaimer}</p>
</body></html>`;
}
