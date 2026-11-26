import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Card } from '../components/ui';
import { useApp } from '../src/AppContext';
import { PACKAGE_IDS, isCancelled, isPro } from '../src/premium/core';
import { getBillingMode, initialize, loadPremium, purchase, restore, presentPaywall } from '../src/premium/service';
import { premiumStrings } from '../src/premium/strings';

export default function Premium() {
  const { lang, theme } = useApp();
  const mode = getBillingMode();
  const s = premiumStrings(lang, mode);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [active, setActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  // Ignore stale foreground requests once a purchase, restore or listener has updated the state.
  const infoVersion = useRef(0);
  const updateStatus = useCallback((pro: boolean | null) => { infoVersion.current += 1; if (mounted.current) setActive(pro); }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = useCallback(async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setNotice('');
    try { await action(); }
    catch (error) {
      if (mounted.current) setNotice(isCancelled(error) ? s.cancelled : error instanceof Error && error.message === 'unavailable' ? s.unavailable : error instanceof Error && ['offering-unavailable', 'paywall-error'].includes(error.message) ? s.paywallMissing : s.error);
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, [s]);
  const load = () => run(async () => {
    await initialize();
    if (!mounted.current) return;
    setStarted(true);
    const version = infoVersion.current;
    const result = await loadPremium();
    if (!mounted.current) return;
    setStarted(true); setPackages(result.packages);
    if (version === infoVersion.current) updateStatus(isPro(result.info));
    if (!result.packages.length) setNotice(s.missing);
    else if (result.packages.length < PACKAGE_IDS.length) setNotice(s.partial);
  });
  useEffect(() => {
    if (!started) return;
    let stop = false;
    let unsubscribe: (() => void) | undefined;
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      // RevenueCat refreshes cached CustomerInfo as appropriate on foreground.
      const version = infoVersion.current;
      initialize().then(sdk => sdk.getCustomerInfo()).then(info => {
        if (!stop && version === infoVersion.current) updateStatus(isPro(info));
      }).catch(() => { if (!stop && version === infoVersion.current) updateStatus(null); });
    });
    initialize().then(sdk => {
      if (stop) return;
      const listener = (info: Parameters<Parameters<typeof sdk.addCustomerInfoUpdateListener>[0]>[0]) => updateStatus(isPro(info));
      sdk.addCustomerInfoUpdateListener(listener);
      unsubscribe = () => { sdk.removeCustomerInfoUpdateListener(listener); };
    }).catch(() => {});
    return () => { stop = true; unsubscribe?.(); appState.remove(); };
  }, [started, updateStatus]);
  const button = (title: string, onPress: () => void, secondary = false) => (
    <Pressable accessibilityRole="button" accessibilityState={{disabled: busy}} disabled={busy} onPress={onPress} style={{minHeight:52,justifyContent:'center',alignItems:'center',borderRadius:12,padding:12,marginVertical:6,backgroundColor:secondary ? theme.card : theme.primary,borderWidth:1,borderColor:theme.border,opacity:busy ? 0.5 : 1}}>
      <Text style={{color:secondary ? theme.text : '#fff',fontSize:16,fontWeight:'700',textAlign:'center'}}>{title}</Text>
    </Pressable>
  );
  return <ScrollView contentContainerStyle={{padding:20,paddingBottom:40,backgroundColor:theme.bg,flexGrow:1}}>
    <Text style={{color:theme.text,fontSize:28,fontWeight:'800'}}>{s.title}</Text>
    <Text style={{color:theme.muted,fontSize:17,marginVertical:8}}>{s.description}</Text>
    <Card><Text style={{color:theme.text,fontWeight:'700',fontSize:16}}>{s.test}</Text></Card>
    <Card><Text style={{color:theme.text,lineHeight:23}}>{s.free}</Text></Card>
    <Card><Text style={{color:theme.text,lineHeight:23}}>{s.privacy}</Text></Card>
    <Text style={{color:theme.text,fontSize:18,fontWeight:'700',marginVertical:8}}>{active === null ? s.unknown : active ? s.active : s.inactive}</Text>
    {packages.map(pkg => {
      const label = pkg.identifier === PACKAGE_IDS[0] ? s.monthly : pkg.identifier === PACKAGE_IDS[1] ? s.annual : s.lifetime;
      return <Card key={pkg.identifier}>
        <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:10}}><Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>{label}</Text><Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>{pkg.product.priceString}</Text></View>
        {button(`${s.buy} · ${label}`, () => { void run(async () => { const info = await purchase(pkg); if (mounted.current) { const pro = isPro(info); updateStatus(pro); setNotice(pro ? s.activeDone : s.pending); } }); })}
      </Card>;
    })}
    {notice ? <Text accessibilityLiveRegion="polite" style={{color:theme.text,marginVertical:10}}>{notice}</Text> : null}
    {busy ? <Text accessibilityLiveRegion="polite" style={{color:theme.muted}}>{s.loading}</Text> : null}
    {mode !== 'unavailable' && button(started ? s.refresh : s.connect, load, true)}
    {started && button(s.paywall, () => { void run(async () => { const outcome = await presentPaywall(); if (mounted.current) { const pro = isPro(outcome.info); updateStatus(pro); setNotice(outcome.result === 'CANCELLED' ? s.paywallClosed : pro ? s.activeDone : s.pending); } }); }, true)}
    {started && button(s.restore, () => { void run(async () => { const info = await restore(); if (mounted.current) { const pro = isPro(info); updateStatus(pro); setNotice(pro ? s.activeDone : s.restored); } }); }, true)}
  </ScrollView>;
}
