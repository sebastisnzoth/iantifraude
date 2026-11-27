import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENT = 'antigolpe_pro';
export const OFFERING = 'default';
export const PACKAGE_IDS = ['$rc_monthly', '$rc_annual', '$rc_lifetime'] as const;
export type PackageId = typeof PACKAGE_IDS[number];

const MAX_OFFLINE_AGE = 3 * 24 * 60 * 60 * 1000;

export function accessUntil(info: CustomerInfo, play: boolean): number {
  const entitlement = info.entitlements.active[ENTITLEMENT];
  if (!entitlement?.isActive) return 0;
  if (play && (entitlement.store !== 'PLAY_STORE' ||
      !['VERIFIED', 'VERIFIED_ON_DEVICE'].includes(info.entitlements.verification))) return 0;
  const checkedAt = Date.parse(info.requestDate);
  const expires = entitlement.expirationDate === null ? Infinity : Date.parse(entitlement.expirationDate);
  if (!Number.isFinite(checkedAt) || checkedAt > Date.now() + 300000 || Number.isNaN(expires)) return 0;
  return Math.min(checkedAt + MAX_OFFLINE_AGE, expires);
}
export function isPro(info: CustomerInfo, play = true): boolean {
  return accessUntil(info, play) > Date.now();
}
export function selectedPackages(offering: PurchasesOffering | undefined, allowLifetime = false): PurchasesPackage[] {
  if (!offering) return [];
  return PACKAGE_IDS.filter(id => allowLifetime || id !== '$rc_lifetime')
    .flatMap(id => offering.availablePackages.filter(p => p.identifier === id).slice(0, 1));
}
export function isCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'userCancelled' in error && (error as {userCancelled?: unknown}).userCancelled === true;
}
