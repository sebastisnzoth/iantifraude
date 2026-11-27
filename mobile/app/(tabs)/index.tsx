import { navigationLabels } from '../../src/navigationLabels';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, PrimaryButton, SectionTitle } from '../../components/ui';
import { useApp } from '../../src/AppContext';
import { loadHistory, type HistoryEntry } from '../../src/storage';
import { useFocusEffect } from 'expo-router';
import { setDraft } from '../../src/session';

export default function Home() {
  const { strings: s, theme, prefs, lang } = useApp();
  const labels = navigationLabels[lang];
  const router = useRouter();
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (prefs.historyEnabled) setRecent(await loadHistory());
    else setRecent([]);
  }, [prefs.historyEnabled]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const paste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text?.trim()) { setNotice(s.clipboardEmpty); return; }
      setNotice(s.clipboardOk);
      setDraft(text.slice(0, 20000));
      router.push('/(tabs)/analyze');
    } catch {
      setNotice(s.clipboardEmpty);
    }
  };

  const levelLabel = (e: HistoryEntry) => (e.level === 2 ? s.riskHigh : e.level === 1 ? s.riskMid : s.riskLow);
  const typeLabel = (e: HistoryEntry) => (e.type === 'link' ? s.typeLink : e.type === 'ocr' ? s.typeOcr : e.type === 'qr' ? s.typeQr : s.typeMessage);

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>◈ {s.appName}</Text>
        <Text style={[styles.slogan, { color: theme.muted }]}>{s.slogan}</Text>
      </View>
      <PrimaryButton title={s.analyzeMessage} onPress={() => router.push({ pathname: '/(tabs)/analyze', params: { mode: 'message' } })} />
      <PrimaryButton title={s.analyzeLink} onPress={() => router.push({ pathname: '/(tabs)/analyze', params: { mode: 'link' } })} />
      <PrimaryButton title={s.analyzeImage} onPress={() => router.push('/ocr')} />
      <PrimaryButton title={s.scanQr} onPress={() => router.push('/qr')} />
      <PrimaryButton title={s.pasteClipboard} secondary onPress={paste} />
      {notice ? <Text style={[styles.notice, { color: theme.muted }]}>{notice}</Text> : null}

      <SectionTitle>{labels.tools}</SectionTitle>
      <Card>
        {(['assistant', 'family', 'alerts'] as const).map(route => (
          <PrimaryButton key={route} title={labels[route]} secondary onPress={() => router.push(`/${route}`)} />
        ))}
      </Card>

      {prefs.historyEnabled ? (
        <>
          <SectionTitle>{s.recent}</SectionTitle>
          <Card>
            {recent.length === 0 ? (
              <Text style={{ color: theme.muted }}>{s.historyEmpty}</Text>
            ) : (
              recent.slice(0, 5).map((e) => (
                <Text key={e.id} style={{ color: theme.text, marginVertical: 3 }}>
                  {new Date(e.date).toLocaleString()} · {typeLabel(e)} · {levelLabel(e)} · {e.count}
                </Text>
              ))
            )}
          </Card>
        </>
      ) : null}

      <SectionTitle>{s.securityTips}</SectionTitle>
      <Card>
        <Text style={{ color: theme.text }}>• {s.tip1}</Text>
        <Text style={{ color: theme.text }}>• {s.tip2}</Text>
        <Text style={{ color: theme.text }}>• {s.tip3}</Text>
        <Text style={{ color: theme.text }}>• {s.tip4}</Text>
      </Card>
      <PrimaryButton title={s.help} secondary onPress={() => router.push('/help')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 30, fontWeight: '800', color: '#08765C' },
  slogan: { fontSize: 17, marginTop: 4 },
  notice: { textAlign: 'center', marginTop: 8 },
});
