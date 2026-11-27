import { addProfile, clearFamily, emptyFamily, loadFamily, MAX_PROFILES, normalizePhone, removeProfile, updateFamily } from '../src/family/store';
import { bulletins, bulletinEdition } from '../src/family/bulletins';
import { clearAllLocalData } from '../src/storage';

const mockValues: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockValues[key] ?? null,
    setItem: async (key: string, value: string) => { mockValues[key] = value; },
    removeItem: async (key: string) => { delete mockValues[key]; },
  },
}));

beforeEach(() => { Object.keys(mockValues).forEach(key => delete mockValues[key]); });

test('stores a sanitized dialable number and rejects URI or dialing commands', () => {
  expect(normalizePhone('+55 (48) 99999-0000')).toBe('+5548999990000');
  for (const phone of ['tel:5551234', '+11;12345', '*21*5551234#', '123', '١٢٣٤٥٦٧']) {
    expect(normalizePhone(phone)).toBe('');
  }
  const state = addProfile(emptyFamily(), '  Abuela\u202e ', '(555) 555-1234', true);
  expect(state.profiles[0]).toMatchObject({ phone: '5555551234', name: 'Abuela', large: true });
  expect(state.active).toBe(state.profiles[0].id);
});

test('profile selection, size limits and removal preserve other profiles', () => {
  let state = emptyFamily();
  for (let n = 0; n < MAX_PROFILES; n++) state = addProfile(state, 'P' + n, '5551234567', false);
  expect(() => addProfile(state, 'Extra', '5551234567', false)).toThrow();
  const next = removeProfile(state, state.active);
  expect(next.profiles).toHaveLength(MAX_PROFILES - 1);
  expect(next.active).toBe(next.profiles[0].id);
});

test('concurrent updates preserve alert opt-in and clear-all erases contact details', async () => {
  await Promise.all([
    updateFamily(state => addProfile(state, 'Abuela', '+5491100012345', true)),
    updateFamily(state => ({ ...state, seenEdition: bulletinEdition })),
  ]);
  expect((await loadFamily()).seenEdition).toBe(bulletinEdition);
  expect((await loadFamily()).profiles).toHaveLength(1);
  await clearAllLocalData();
  expect(await loadFamily()).toEqual(emptyFamily());
  expect(JSON.stringify(mockValues)).not.toContain('54911');
});

test('invalid contact values in legacy storage are excluded; even corrupt stores can be erased', async () => {
  mockValues['antigolpe:family'] = JSON.stringify({ profiles: [{ id: 'a', name: 'A', phone: 'tel:bad', large: true }], active: 'a' });
  expect(await loadFamily()).toEqual(emptyFamily());
  mockValues['antigolpe:family'] = '{';
  await expect(loadFamily()).rejects.toThrow();
  await clearFamily();
  expect(await loadFamily()).toEqual(emptyFamily());
});

test('each shipped bulletin has an official HTTPS source, publication date, region and complete translations', () => {
  expect(new Set(bulletins.map(b => b.id)).size).toBe(bulletins.length);
  for (const b of bulletins) {
    expect(new URL(b.url).protocol).toBe('https:');
    expect(['www.gov.br', 'www.fiscales.gob.ar']).toContain(new URL(b.url).hostname);
    expect(b.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const lang of ['es', 'pt', 'en'] as const) {
      expect(b.title[lang].length).toBeGreaterThan(5);
      expect(b.body[lang].length).toBeGreaterThan(20);
    }
  }
});
