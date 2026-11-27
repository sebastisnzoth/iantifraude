import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, Switch, Text, TextInput, View } from 'react-native';
import { Card, PrimaryButton, SectionTitle } from '../components/ui';
import { useApp } from '../src/AppContext';
import { analyzeText } from '../src/engine';
import { buildTextReport } from '../src/report';
import { getAnalysis } from '../src/session';
import { addProfile, cleanName, loadFamily, MAX_PROFILES, normalizePhone, removeProfile, updateFamily, type FamilySettings } from '../src/family/store';
import { familyText } from '../src/family/strings';

function Action({ label, large, onPress }: { label: string; large: boolean; onPress: () => void }) {
  const { theme } = useApp();
  if (!large) return <PrimaryButton title={label} onPress={onPress} />;
  return <Pressable accessibilityRole="button" onPress={onPress} style={{
    backgroundColor: theme.primary, padding: 18, minHeight: 72, justifyContent: 'center', borderRadius: 12, marginVertical: 8,
  }}>
    <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </Pressable>;
}

export default function Family() {
  const { lang, theme, proActive, proReady } = useApp();
  const router = useRouter();
  const s = familyText[lang];
  const [data, setData] = useState<FamilySettings | null>(null);
  const [manage, setManage] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [large, setLarge] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');
  const saving = React.useRef(false);
  useEffect(() => {
    let live = true;
    if (proActive) loadFamily().then(saved => { if (live) setData(saved); }).catch(() => { if (live) setError(s.failure); });
    return () => { live = false; };
  }, [proActive, s.failure]);

  if (!proReady) return <Text style={{ color: theme.text }}>{s.loading}</Text>;
  if (!proActive) return <Redirect href="/premium" />;
  if (!data) return <Text style={{ color: theme.text }}>{error || s.loading}</Text>;
  const active = data.profiles.find(p => p.id === data.active);
  const editing = manage || !active;
  const latest = getAnalysis();
  const fieldStyle = { borderWidth: 1, borderColor: theme.border, borderRadius: 10, color: theme.text, padding: 12, fontSize: 18, marginVertical: 6 };

  const change = async (fn: (d: FamilySettings) => FamilySettings) => {
    if (saving.current) return false;
    saving.current = true;
    setError('');
    try { setData(await updateFamily(fn)); return true; }
    catch { setError(s.failure); return false; }
    finally { saving.current = false; }
  };

  const save = async () => {
    if (!cleanName(name) || !normalizePhone(phone)) { setError(s.invalid); return; }
    if (await change(d => addProfile(d, name, phone, large))) {
      setManage(false); setName(''); setPhone(''); setReport('');
    }
  };

  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, flexGrow: 1, backgroundColor: theme.bg }}>
    <Stack.Screen options={{ title: s.family }} />
    {active && !editing && <>
      <SectionTitle>{active.name}</SectionTitle>
      <Text style={{ color: theme.text, fontSize: active.large ? 22 : 17, marginVertical: 12 }}>{s.emergency}</Text>
      <Action large={active.large} label={s.call} onPress={() => {
        Linking.openURL('tel:' + active.phone).catch(() => setError(s.failure));
      }} />
      <Action large={active.large} label={s.analyze} onPress={() => router.push('/(tabs)/analyze')} />
      {!!latest.text.trim() && !report && <Action large={active.large} label={s.share} onPress={() => {
        setReport(buildTextReport(analyzeText(latest.text, latest.type), lang, latest.type));
      }} />}
      {!!report && <Card>
        <Text selectable style={{ color: theme.text, fontSize: active.large ? 21 : 17 }}>{report}</Text>
        <PrimaryButton title={s.shareAction} onPress={() => {
          Share.share({ message: report }).then(() => setReport('')).catch(() => setError(s.failure));
        }} />
        <PrimaryButton title={s.cancel} secondary onPress={() => setReport('')} />
      </Card>}
      <PrimaryButton secondary title={s.manage} onPress={() => { setReport(''); setManage(true); }} />
    </>}
    {editing && <>
      {data.profiles.map(p => <Card key={p.id}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>{p.name}</Text>
        <Text style={{ color: theme.muted }}>{p.phone}</Text>
        <PrimaryButton secondary title={p.id === data.active ? s.done : p.name} onPress={async () => {
          if (await change(d => ({ ...d, active: p.id }))) setManage(false);
        }} />
        <Text style={{ color: theme.text }}>{s.large}</Text>
        <Switch accessibilityLabel={s.large} value={p.large} onValueChange={value => {
          void change(d => ({ ...d, profiles: d.profiles.map(item => item.id === p.id ? { ...item, large: value } : item) }));
        }} />
        <PrimaryButton secondary title={s.remove} onPress={() => Alert.alert(s.remove, s.removeBody, [
          { text: s.cancel, style: 'cancel' },
          { text: s.remove, style: 'destructive', onPress: () => { void change(d => removeProfile(d, p.id)); } },
        ])} />
      </Card>)}
      {data.profiles.length < MAX_PROFILES ? <View>
        <SectionTitle>{s.new}</SectionTitle>
        <Text style={{ color: theme.muted, marginVertical: 8 }}>{s.privacy}</Text>
        <Text style={{ color: theme.text }}>{s.profile}</Text>
        <TextInput accessibilityLabel={s.profile} maxLength={48} value={name} onChangeText={setName} style={fieldStyle} />
        <Text style={{ color: theme.text }}>{s.phone}</Text>
        <TextInput accessibilityLabel={s.phone} maxLength={28} keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={fieldStyle} />
        <Text style={{ color: theme.text }}>{s.large}</Text>
        <Switch accessibilityLabel={s.large} value={large} onValueChange={setLarge} />
        <PrimaryButton title={s.add} onPress={save} />
      </View> : <Text style={{ color: theme.text }}>{s.max}</Text>}
    </>}
    {!!error && <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text>}
  </ScrollView>;
}
