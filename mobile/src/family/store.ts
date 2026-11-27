import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'antigolpe:family';
export const MAX_PROFILES = 12;

export interface FamilyProfile {
  id: string;
  name: string;
  phone: string;
  large: boolean;
}

export interface FamilySettings {
  profiles: FamilyProfile[];
  active: string;
  // A non-null edition opts in to notices about later bulletin editions.
  seenEdition: string | null;
}

export function emptyFamily(): FamilySettings {
  return { profiles: [], active: '', seenEdition: null };
}

export function normalizePhone(phone: string) {
  if (!/^[+\d ().-]+$/.test(phone)) return '';
  const number = phone.replace(/[ ().-]/g, '');
  return /^\+?[0-9]{7,15}$/.test(number) ? number : '';
}

export function cleanName(name: string) {
  return name.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, 48);
}

export function addProfile(settings: FamilySettings, name: string, phone: string, large: boolean): FamilySettings {
  if (!cleanName(name) || !normalizePhone(phone) || settings.profiles.length >= MAX_PROFILES) throw new Error('invalid-profile');
  const profile = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), name: cleanName(name), phone: normalizePhone(phone), large };
  return { ...settings, profiles: [...settings.profiles, profile], active: profile.id };
}

export function removeProfile(settings: FamilySettings, id: string): FamilySettings {
  const profiles = settings.profiles.filter(profile => profile.id !== id);
  return { ...settings, profiles, active: settings.active === id ? profiles[0]?.id ?? '' : settings.active };
}

export async function loadFamily(): Promise<FamilySettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) return emptyFamily();
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.profiles)) throw new Error('invalid-family-store');
  const profiles: FamilyProfile[] = value.profiles.filter((p: FamilyProfile | null) =>
    p && typeof p.id === 'string' && typeof p.name === 'string' && cleanName(p.name) === p.name && !!p.name &&
    typeof p.phone === 'string' && !!p.phone && normalizePhone(p.phone) === p.phone && typeof p.large === 'boolean'
  ).slice(0, MAX_PROFILES);
  return {
    profiles,
    active: profiles.some(p => p.id === value.active) ? value.active : profiles[0]?.id ?? '',
    seenEdition: typeof value.seenEdition === 'string' ? value.seenEdition : null,
  };
}

let queue = Promise.resolve<unknown>(undefined);
function ordered<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

export function updateFamily(change: (state: FamilySettings) => FamilySettings) {
  return ordered(async () => {
    const current = await loadFamily();
    const next = change(current);
    if (next !== current) await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
}

export function clearFamily() {
  return ordered(() => AsyncStorage.removeItem(KEY));
}
