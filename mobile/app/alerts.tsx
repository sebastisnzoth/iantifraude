import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, Switch, Text } from 'react-native';
import { Card, PrimaryButton, SectionTitle } from '../components/ui';
import { useApp } from '../src/AppContext';
import { bulletinEdition, bulletins } from '../src/family/bulletins';
import { loadFamily, updateFamily } from '../src/family/store';
import { familyText } from '../src/family/strings';

export default function Alerts() {
  const { proReady, proActive, lang, theme } = useApp();
  const s = familyText[lang];
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    if (proActive) loadFamily().then(state => { if (live) setEnabled(state.seenEdition !== null); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [proActive]);
  if (!proReady) return <Text style={{ color: theme.text }}>{s.loading}</Text>;
  if (!proActive) return <Redirect href="/premium" />;

  const toggle = async (value: boolean) => {
    setFailed(false);
    setEnabled(null);
    try {
      await updateFamily(state => ({ ...state, seenEdition: value ? bulletinEdition : null }));
      setEnabled(value);
    } catch { setFailed(true); setEnabled(!value); }
  };

  return <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: theme.bg, flexGrow: 1 }}>
    <Stack.Screen options={{ title: s.alerts }} />
    <Text style={{ color: theme.muted }}>{s.edition}</Text>
    {bulletins.map(b => <Card key={b.id}>
      <Text style={{ color: theme.muted }}>{b.region} · {b.agency} · {b.published}</Text>
      <SectionTitle>{b.title[lang]}</SectionTitle>
      <Text style={{ color: theme.text, fontSize: 17, marginVertical: 10 }}>{b.body[lang]}</Text>
      <PrimaryButton secondary title={s.source} onPress={() => { Linking.openURL(b.url).catch(() => setFailed(true)); }} />
    </Card>)}
    <Text style={{ color: theme.text }}>{s.notify}</Text>
    <Switch accessibilityLabel={s.notify} disabled={enabled === null} value={enabled === true} onValueChange={toggle} />
    {failed && <Text accessibilityRole="alert" style={{ color: theme.text }}>{s.failure}</Text>}
  </ScrollView>;
}
