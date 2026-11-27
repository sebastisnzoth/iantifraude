import { navigationLabels } from '../src/navigationLabels';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppProvider, useApp } from '../src/AppContext';
import { BulletinNotice } from '../components/BulletinNotice';

function RootStack() {
  const { theme, prefs, lang, strings } = useApp();
  return (
    <>
      <BulletinNotice />
      <StatusBar style={prefs.darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {(['assistant', 'family', 'alerts'] as const).map(name => (
          <Stack.Screen key={name} name={name} options={{ title: navigationLabels[lang][name] }} />
        ))}
        <Stack.Screen name="premium" options={{ title: 'AntiGolpe Pro' }} />
        <Stack.Screen name="result" options={{ title: 'AntiGolpe AI' }} />
        <Stack.Screen name="qr" options={{ title: 'QR' }} />
        <Stack.Screen name="ocr" options={{ title: 'OCR' }} />
        <Stack.Screen name="privacy" options={{ title: strings.settingsPrivacy }} />
        <Stack.Screen name="terms" options={{ title: strings.settingsTerms }} />
        <Stack.Screen name="help" options={{ title: strings.help }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootStack />
    </AppProvider>
  );
}
