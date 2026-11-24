import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/AppContext';

export default function TabsLayout() {
  const { strings: s, theme } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border, minHeight: 60 },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: s.home, tabBarIcon: ({color,size}) => <Ionicons name="home-outline" color={typeof color === "string" ? color : theme.primary} size={size} /> }} />
      <Tabs.Screen name="analyze" options={{ title: s.analyze, tabBarIcon: ({color,size}) => <Ionicons name="search-outline" color={typeof color === "string" ? color : theme.primary} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: s.history, tabBarIcon: ({color,size}) => <Ionicons name="time-outline" color={typeof color === "string" ? color : theme.primary} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: s.settings, tabBarIcon: ({color,size}) => <Ionicons name="settings-outline" color={typeof color === "string" ? color : theme.primary} size={size} /> }} />
    </Tabs>
  );
}
