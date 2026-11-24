import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useApp } from '../src/AppContext';

export default function Onboarding() {
  const { strings: s, theme, updatePrefs } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slides = [
    { title: s.onboarding1Title, body: s.onboarding1Body, icon: 'shield-checkmark-outline' as const },
    { title: s.onboarding2Title, body: s.onboarding2Body, icon: 'search-outline' as const },
    { title: s.onboarding3Title, body: s.onboarding3Body, icon: 'lock-closed-outline' as const },
  ];
  const finish = async () => {
    await updatePrefs({ onboardingDone: true });
    router.replace('/(tabs)');
  };
  const slide = slides[step];
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Ionicons name={slide.icon} size={64} color={theme.primary} style={{textAlign: 'center', marginBottom: 16}} />
      <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
      <Text style={[styles.body, { color: theme.muted }]}>{slide.body}</Text>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === step ? theme.primary : theme.border }]} />
        ))}
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title={step < 2 ? s.continueBtn : s.getStarted}
          onPress={() => (step < 2 ? setStep(step + 1) : finish())}
        />
        <PrimaryButton title={s.skip} secondary onPress={finish} />
      </View>
      <Text style={[styles.offline, { color: theme.muted }]}>{s.offlineNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 28, justifyContent: 'center' },
  icon: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 34 },
  body: { fontSize: 17, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 24, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actions: { marginTop: 8 },
  offline: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});
