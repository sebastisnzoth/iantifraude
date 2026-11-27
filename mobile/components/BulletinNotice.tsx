import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useApp } from '../src/AppContext';
import { bulletinEdition } from '../src/family/bulletins';
import { updateFamily } from '../src/family/store';
import { familyText } from '../src/family/strings';

export function BulletinNotice() {
  const { lang, proActive } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!proActive) return;
    let mounted = true;
    let notify = false;
    void updateFamily(state => {
      if (!mounted || state.seenEdition === null || state.seenEdition === bulletinEdition) return state;
      const seen = new Set(state.seenEdition.split('|'));
      notify = bulletinEdition.split('|').some(id => !seen.has(id));
      return { ...state, seenEdition: bulletinEdition };
    }).then(() => {
      if (!mounted || !notify) return;
      const s = familyText[lang];
      Alert.alert(s.alerts, s.newest, [
        { text: s.close, style: 'cancel' },
        { text: s.open, onPress: () => router.push('/alerts') },
      ]);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [lang, proActive, router]);
  return null;
}
