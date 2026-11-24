import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../src/AppContext';

export default function Index() {
  const { ready, prefs } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#08765C" />
      </View>
    );
  }
  return <Redirect href={prefs.onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
