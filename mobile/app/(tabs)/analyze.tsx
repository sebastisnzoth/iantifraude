import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { PrimaryButton } from '../../components/ui';
import { useApp } from '../../src/AppContext';
import { sanitizeText, validateText } from '../../src/validation';
import { setAnalysis, takeDraft, sessionGeneration } from '../../src/session';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const SAMPLES: Record<string, string> = {
  es: 'URGENTE: tu cuenta será bloqueada. Confirmá tu contraseña y código de verificación ahora en http://banco-premio.xyz/login',
  pt: 'URGENTE: sua conta será bloqueada. Confirme sua senha e código de verificação agora em http://banco-premio.xyz/login',
  en: 'URGENT: your account will be blocked. Confirm your password and verification code now at http://bank-prize.xyz/login',
};

export default function Analyze() {
  const { strings: s, theme, lang } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialText?: string; mode?: string }>();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const generation = useRef(sessionGeneration());

  useFocusEffect(useCallback(() => {
    if (generation.current !== sessionGeneration()) { setText(''); setError(''); generation.current = sessionGeneration(); }
    const draft = takeDraft(); if (draft) setText(sanitizeText(draft));
  }, []));

  const run = () => {
    const clean = sanitizeText(text);
    const v = validateText(clean);
    if (!v.ok) { setError(v.error === 'empty' ? s.emptyError : s.tooShortError); return; }
    setError('');
    const type = params.mode === 'link' ? 'link' : 'message';
    setAnalysis(clean, type);
    router.push('/result');
  };

  const paste = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (!clip?.trim()) { setError(s.clipboardEmpty); return; }
      setText(sanitizeText(clip));
      setError('');
    } catch { setError(s.clipboardEmpty); }
  };

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
      <Text style={[styles.label, { color: theme.text }]}>{s.pasteText}</Text>
      <TextInput
        value={text}
        onChangeText={(v) => { setText(v); setError(''); }}
        multiline
        maxLength={20000}
        placeholder={s.pasteText}
        placeholderTextColor={theme.muted}
        accessibilityLabel={s.pasteText}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title={s.analyzeBtn} onPress={run} />
      <PrimaryButton title={s.pasteClipboard} secondary onPress={paste} />
      <PrimaryButton title={s.example} secondary onPress={() => { setText(SAMPLES[lang] ?? SAMPLES.es); setError(''); }} />
      <PrimaryButton title={s.clear} secondary onPress={() => { setText(''); setError(''); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 180, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, textAlignVertical: 'top' },
  error: { color: '#DC2626', marginTop: 8, fontWeight: '700' },
});
