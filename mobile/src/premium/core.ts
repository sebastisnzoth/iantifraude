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
