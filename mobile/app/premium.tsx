import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { Card } from '../components/ui';
import { useApp } from '../src/AppContext';
import { isCancelled, isPro, PACKAGE_IDS } from '../src/premium/core';
import { billingMode, loadPremium, purchase, restore } from '../src/premium/service';
import { premiumStrings } from '../src/premium/strings';

function Action({ label, onPress, disabled = false, primary = false }: {
  label: string; onPress: () => void; disabled?: boolean; primary?: boolean;
}) {
  const { theme } = useApp();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={{ padding: 14, minHeight: 52, justifyContent: 'center', marginVertical: 5, borderRadius: 12,
      borderWidth: 1, borderColor: theme.border, backgroundColor: primary ? theme.primary : theme.card, opacity: disabled ? 0.5 : 1 }}>
    <Text style={{ color: primary ? '#fff' : theme.text, textAlign: 'center', fontSize: 17, fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}

export default function Premium() {
  const { lang, theme, prefs, updatePrefs, updateCustomer, proActive } = useApp();
  const s = premiumStrings(lang);
  const router = useRouter();
  const mode = billingMode();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try { await action(); }
    catch (error) { if (mounted.current) setNotice(isCancelled(error) ? s.cancelled : s.error); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function consent() {
    if (!prefs.billingConsent) await updatePrefs({ billingConsent: true });
  }
  const labelFor = (pkg: PurchasesPackage) =>
    pkg.identifier === PACKAGE_IDS[0] ? s.monthly : pkg.identifier === PACKAGE_IDS[1] ? s.annual : s.lifetime;
  const storeActive = mode !== null;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, backgroundColor: theme.bg, flexGrow: 1 }}>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{s.title}</Text>
    <Text style={{ color: theme.muted, fontSize: 18, marginVertical: 8 }}>{s.description}</Text>
    <Card><Text style={{ color: theme.text, lineHeight: 25 }}>{s.free}</Text>
      <Text style={{ color: theme.text, lineHeight: 25, fontWeight: '700', marginTop: 6 }}>{s.pro}</Text></Card>
    <Text style={{ color: theme.text }}>{mode === 'test' ? s.test : mode === 'play' ? s.store : s.unavailable}</Text>
    {proActive && <Text accessibilityLiveRegion="polite" style={{ color: theme.primary, fontWeight: '700' }}>{s.active}</Text>}
    {storeActive && <>
      <Card><Text style={{ color: theme.text }}>{s.consent}</Text></Card>
      <Action label={packages.length ? s.refresh : s.connect} disabled={busy} onPress={() => void run(async () => {
        await consent();
        setSelected(null);
        setPackages([]);
        const result = await loadPremium();
        if (mounted.current) {
          setPackages(result.packages);
          if (!result.packages.length) setNotice(s.missing);
        }
      })} />
      {packages.map(pkg => <Pressable key={pkg.identifier} accessibilityRole="radio"
        accessibilityState={{ checked: selected?.identifier === pkg.identifier, disabled: busy || proActive }}
        disabled={busy || proActive} onPress={() => setSelected(pkg)}
        style={{ padding: 16, marginVertical: 4, borderRadius: 12, borderWidth: 2,
          borderColor: selected?.identifier === pkg.identifier ? theme.primary : theme.border, backgroundColor: theme.card }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{labelFor(pkg)} · {pkg.product.priceString}</Text>
      </Pressable>)}
      {selected && !proActive && <>
        {selected.identifier !== PACKAGE_IDS[2] && mode === 'play' && <Text style={{ color: theme.muted, marginVertical: 8 }}>{s.renewal}</Text>}
        <Action primary disabled={busy} label={s.buy + ' ' + labelFor(selected)} onPress={() => void run(async () => {
          const info = await purchase(selected);
          updateCustomer(info);
          if (mounted.current) setNotice(isPro(info, mode === 'play') ? s.active : s.pending);
        })} />
      </>}
      <Action label={s.restore} disabled={busy} onPress={() => void run(async () => {
        await consent();
        const info = await restore();
        updateCustomer(info);
        if (mounted.current) setNotice(isPro(info, mode === 'play') ? s.restored : s.pending);
      })} />
      {mode === 'play' && <Action label={s.manage} disabled={busy} onPress={() => void run(async () => {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      })} />}
    </>}
    {busy || notice ? <Text accessibilityLiveRegion="polite" style={{ color: theme.text, marginVertical: 8 }}>{busy ? s.busy : notice}</Text> : null}
    <Action label={s.privacy} onPress={() => router.push('/privacy')} />
    <Action label={s.terms} onPress={() => router.push('/terms')} />
    <Action label={proActive ? s.close : s.back} onPress={() => router.replace('/(tabs)')} />
  </ScrollView>;
}
