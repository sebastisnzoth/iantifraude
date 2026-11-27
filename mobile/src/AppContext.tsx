import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Localization from 'expo-localization';
import { detectLang, t } from './i18n';
import { DEFAULT_PREFS, loadPrefs, savePrefs, type Prefs } from './storage';
import { getTheme, type Theme } from './theme';
import type { Lang } from './engine';

import { usePremium } from './premium/usePremium';

interface AppState extends ReturnType<typeof usePremium> {
  prefs: Prefs;
  lang: Lang;
  strings: ReturnType<typeof t>;
  theme: Theme;
  ready: boolean;
  updatePrefs: (patch: Partial<Prefs>) => Promise<void>;
}

const Ctx = createContext<AppState>({
  prefs: DEFAULT_PREFS, lang: 'es', strings: t('es'), theme: getTheme(false),
  proActive: false, proReady: false, updateCustomer: () => {},
  ready: false, updatePrefs: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const { proActive, proReady, updateCustomer } = usePremium(prefs.billingConsent, ready);
  const prefsRef = useRef(prefs);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    (async () => {
      const stored = await loadPrefs();
      // Si nunca se guardó idioma, detectar del dispositivo
      try {
        const raw = await import('@react-native-async-storage/async-storage').then((m) => m.default.getItem('antigolpe:prefs'));
        if (!raw) {
          const device = Localization.getLocales?.()[0]?.languageCode ?? null;
          stored.language = detectLang(device);
        }
      } catch { /* noop */ }
      prefsRef.current = stored;
      setPrefs(stored);
      setReady(true);
    })();
  }, []);

  const updatePrefs = useCallback(async (patch: Partial<Prefs>) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    // Persist in order; a failed write must not prevent later writes.
    const write = saveQueue.current.catch(() => {}).then(() => savePrefs(next));
    saveQueue.current = write;
    await write;
  }, []);

  const value = useMemo<AppState>(() => ({
    prefs,
    lang: prefs.language,
    strings: t(prefs.language),
    theme: getTheme(prefs.darkMode),
    ready, proActive, proReady, updateCustomer,
    updatePrefs,
  }), [prefs, ready, proActive, proReady, updateCustomer, updatePrefs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  return useContext(Ctx);
}
