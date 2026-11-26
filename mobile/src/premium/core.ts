import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENT = 'antigolpe_pro';
export const OFFERING = 'default';
export const PACKAGE_IDS = ['$rc_monthly', '$rc_annual', '$rc_lifetime'] as const;
export type PackageId = typeof PACKAGE_IDS[number];

export function isPro(info: Pick<CustomerInfo, 'entitlements'>): boolean {
  return Boolean(info.entitlements.active[ENTITLEMENT]?.isActive);
}
export function selectedPackages(offering: PurchasesOffering | undefined): PurchasesPackage[] {
  if (!offering) return [];
  return PACKAGE_IDS.flatMap(id => offering.availablePackages.filter(p => p.identifier === id).slice(0, 1));
}
export function isCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'userCancelled' in error && (error as {userCancelled?: unknown}).userCancelled === true;
}

export type BillingMode = 'test' | 'play' | 'unavailable';
export function selectBillingMode(platform: string, dev: boolean, expoGo: boolean, extra?: {revenueCatTestKey?: unknown; revenueCatPlayKey?: unknown}): BillingMode {
  if (expoGo || (platform !== 'android' && platform !== 'ios')) return 'unavailable';
  const testKey = extra?.revenueCatTestKey;
  const playKey = extra?.revenueCatPlayKey;
  if (testKey && playKey) return 'unavailable';
  if (dev && typeof testKey === 'string' && /^test_[A-Za-z0-9_]+$/.test(testKey)) return 'test';
  if (!dev && platform === 'android' && typeof playKey === 'string' && /^goog_[A-Za-z0-9_]+$/.test(playKey)) return 'play';
  return 'unavailable';
}
