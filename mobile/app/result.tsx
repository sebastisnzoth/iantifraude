import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text } from 'react-native';
import { Card, PrimaryButton, RiskBadge, SectionTitle } from '../components/ui';
import { useApp } from '../src/AppContext';
import { CATEGORY_LABEL, RECOMMENDATION_TEXT, type AnalysisResult, type AnalysisType } from '../src/engine';
import { activeProvider } from '../src/ai/provider';
import { buildHtmlReport, buildTextReport } from '../src/report';
import { addHistory } from '../src/storage';
import { clearSession, getAnalysis } from '../src/session';

export default function Result() {
  const { strings: s, theme, lang, prefs } = useApp();
  const router = useRouter();
  const [analysis] = useState(getAnalysis);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notice, setNotice] = useState('');
  const { text, type } = analysis;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await activeProvider.analyze(text, type);
      if (cancelled) return;
      setResult(r);
      if (prefs.historyEnabled && !r.insufficient) {
        addHistory({ type, level: r.level, count: r.signals.length }).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, type]);

  const levelLabel = useMemo(() => {
    if (!result) return '';
    if (result.insufficient) return s.insufficient;
    return result.level === 2 ? s.riskHigh : result.level === 1 ? s.riskMid : s.riskLow;
  }, [result, s]);

  if (!result) {
    return (
      <ScrollView contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>…</Text>
      </ScrollView>
    );
  }

  const reportText = buildTextReport(result, lang, type);
  const copy = async () => {
    try { await Clipboard.setStringAsync(reportText); setNotice(s.copied); }
    catch { setNotice(s.shareUnavailable); }
  };
  const share = async () => {
    try {
      await Share.share({ message: reportText });
    } catch { setNotice(s.shareUnavailable); }
  };
  const pdf = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHtmlReport(result, lang) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } else setNotice(s.pdfUnavailable);
    } catch { setNotice(s.pdfUnavailable); }
  };

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
      <RiskBadge level={result.level} insufficient={result.insufficient} label={levelLabel} score={result.score} />
      <Text style={[styles.note, { color: theme.muted }]}>{s.heuristicNote}</Text>
      {result.insufficient ? (
        <Card><Text style={{ color: theme.text }}>{s.insufficientBody}</Text></Card>
      ) : (
        <>
          <SectionTitle>{s.categoryTitle}</SectionTitle>
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700' }}>
              {result.category ? (CATEGORY_LABEL[result.category]?.[lang] ?? result.category) : '—'}
            </Text>
          </Card>
          <SectionTitle>{s.signalsTitle}</SectionTitle>
          <Card>
            {result.signals.length === 0 ? (
              <Text style={{ color: theme.text }}>{s.noSignals}</Text>
            ) : (
              result.signals.map((sig) => (
                <Text key={sig.id} style={{ color: theme.text, marginVertical: 4 }}>
                  • {sig.label[lang]}
                  {"\n"}{sig.explanation[lang]}
                </Text>
              ))
            )}
          </Card>
          <SectionTitle>{s.recommendationsTitle}</SectionTitle>
          <Card>
            {result.recommendations.map((key) => (
              <Text key={key} style={{ color: theme.text, marginVertical: 4 }}>
                • {RECOMMENDATION_TEXT[key]?.[lang] ?? key}
              </Text>
            ))}
          </Card>
        </>
      )}
      <Text style={[styles.disclaimer, { color: theme.muted }]}>{s.disclaimer}</Text>
      {notice ? <Text style={{ color: theme.muted, textAlign: 'center' }}>{notice}</Text> : null}
      <PrimaryButton title={s.copyResult} onPress={copy} />
      <PrimaryButton title={s.shareReport} secondary onPress={share} />
      <PrimaryButton title={s.exportPdf} secondary onPress={pdf} />
      <PrimaryButton title={s.newAnalysis} secondary onPress={() => { clearSession(); router.replace('/(tabs)/analyze'); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 40 },
  note: { textAlign: 'center', marginBottom: 8 },
  disclaimer: { marginVertical: 12, fontSize: 13, lineHeight: 18 },
});
