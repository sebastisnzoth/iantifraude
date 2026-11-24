import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../src/AppContext';
import { riskColor } from '../src/theme';

export function PrimaryButton({ title, onPress, secondary }: { title: string; onPress: () => void; secondary?: boolean }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: secondary ? theme.card : theme.primary, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: secondary ? theme.primary : '#FFFFFF' }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}

export function RiskBadge({ level, insufficient, label, score }: { level: number; insufficient: boolean; label: string; score: number }) {
  const color = riskColor(level, insufficient);
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '18' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
      <Text style={[styles.badgeScore, { color }]}>{score}/100</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  return <Text style={[styles.section, { color: theme.text }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, marginVertical: 6, minHeight: 52, justifyContent: 'center' },
  btnText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginVertical: 8 },
  badge: { borderRadius: 14, borderWidth: 2, padding: 14, alignItems: 'center', marginVertical: 8 },
  badgeText: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  badgeScore: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  section: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 4 },
});
