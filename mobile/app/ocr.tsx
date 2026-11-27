import { setAnalysis } from '../src/session';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useApp } from '../src/AppContext';
import { PrimaryButton } from '../components/ui';
import { sanitizeText, validateText } from '../src/validation';
import { OcrFailure, recognizeScreenshot } from '../src/ocr';

export default function Ocr() {
  const { strings: s, theme } = useApp();
  const router = useRouter();
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const pick = async (camera: boolean) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setNotice('');
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setNotice(s.ocrNoPermission); return; }
      }
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (result.canceled || !result.assets[0]) return;
      const extracted = await recognizeScreenshot(result.assets[0]);
      if (extracted.trim()) { setText(extracted); setNotice(s.ocrExtracted); }
      else setNotice(s.ocrEmpty);
    } catch (error) {
      setNotice(error instanceof OcrFailure && (error.code === 'size' || error.code === 'image') ? s.ocrInvalid : s.ocrManual);
    } finally { locked.current = false; setBusy(false); }
  };
  return <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: theme.bg, flexGrow: 1 }}>
    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{s.ocrTitle}</Text>
    <Text style={{ color: theme.text, marginVertical: 12 }}>{s.ocrReady}</Text>
    <PrimaryButton secondary title={s.ocrPick} onPress={() => { void pick(false); }} />
    <PrimaryButton secondary title={s.ocrCamera} onPress={() => { void pick(true); }} />
    <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{busy ? s.ocrBusy : notice}</Text>
    <TextInput accessibilityLabel={s.ocrExtracted} multiline maxLength={20000} value={text} onChangeText={setText} style={{ height: 180, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, color: theme.text, padding: 12, marginVertical: 12, textAlignVertical: 'top' }} />
    <PrimaryButton title={s.ocrAnalyze} onPress={() => { const clean = sanitizeText(text); if (!validateText(clean).ok) { setNotice(s.emptyError); return; } setAnalysis(clean, 'ocr'); router.push('/result'); }} />
  </ScrollView>;
}
