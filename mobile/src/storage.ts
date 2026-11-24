import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisType, Lang, RiskLevel } from './engine';
import { LIMITS } from './validation';

export interface Prefs {
  language: Lang;
  darkMode: boolean;
  historyEnabled: boolean;
  onboardingDone: boolean;
}

export interface HistoryEntry {
  id: string;
  date: number;
  type: AnalysisType;
  level: RiskLevel;
  count: number;
}

const PREFS_KEY = 'antigolpe:prefs';
const HISTORY_KEY = 'antigolpe:history';

export const DEFAULT_PREFS: Prefs = {
  language: 'es',
  darkMode: false,
  historyEnabled: false,
  onboardingDone: false,
};

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs> | null;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFS };
    return {
      language: ['es', 'pt', 'en'].includes(parsed.language as string) ? parsed.language as Lang : DEFAULT_PREFS.language,
      darkMode: parsed.darkMode === true,
      historyEnabled: parsed.historyEnabled === true,
      onboardingDone: parsed.onboardingDone === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e && typeof e.id === 'string' && typeof e.date === 'number' &&
        ['message', 'link', 'ocr', 'qr'].includes(e.type) &&
        [0, 1, 2].includes(e.level) && typeof e.count === 'number',
    );
  } catch {
    return [];
  }
}

// Serialize read-modify-write operations so concurrent deletes cannot resurrect entries.
let historyQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = historyQueue.then(operation, operation);
  historyQueue = next.catch(() => {});
  return next;
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'date'>): Promise<HistoryEntry[]> {
  return enqueue(async () => {
  const current = await loadHistory();
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: Date.now(),
  };
  const next = [full, ...current].slice(0, LIMITS.historyMax);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
  });
}

export function removeHistory(id: string): Promise<HistoryEntry[]> {
  return enqueue(async () => {
  const current = await loadHistory();
  const next = current.filter((e) => e.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
  });
}

export function clearHistory(): Promise<void> {
  return enqueue(() => AsyncStorage.removeItem(HISTORY_KEY));
}

export async function clearAllLocalData(): Promise<void> {
  await AsyncStorage.removeItem(PREFS_KEY);
  await clearHistory();
}
