import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppProvider, useApp } from '../src/AppContext';

function RootStack() {
  const { theme, prefs } = useApp();
  return (
    <>
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
        <Stack.Screen name="premium" options={{ title: 'AntiGolpe Pro' }} />
        <Stack.Screen name="result" options={{ title: 'AntiGolpe AI' }} />
        <Stack.Screen name="qr" options={{ title: 'QR' }} />
        <Stack.Screen name="ocr" options={{ title: 'OCR' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacidad' }} />
        <Stack.Screen name="terms" options={{ title: 'Términos' }} />
        <Stack.Screen name="help" options={{ title: 'Ayuda' }} />
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
