import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { OFFERING, selectedPackages } from './core';

export function billingMode(): 'play' | 'test' | null {
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  const extra = Constants.expoConfig?.extra;
  if (__DEV__ && /^test_[a-zA-Z0-9]+$/.test(extra?.revenueCatTestKey ?? '')) return 'test';
  if (Platform.OS === 'android' && /^goog_[a-zA-Z0-9]+$/.test(extra?.revenueCatGoogleKey ?? '')) return 'play';
  return null;
}
let initialization: Promise<typeof import('react-native-purchases').default> | undefined;
export function initialize() {
  const mode = billingMode();
  if (!mode) return Promise.reject(new Error('unavailable'));
  const extra = Constants.expoConfig!.extra!;
  const key = mode === 'test' ? extra.revenueCatTestKey : extra.revenueCatGoogleKey;
  if (!initialization) {
    initialization = Promise.resolve().then(async () => {
      const Purchases = (require('react-native-purchases') as typeof import('react-native-purchases')).default;
      const identity = mode === 'play' ? await (await import('../ai/identity')).installationIdentity() : null;
      Purchases.configure(identity ? { apiKey: key, appUserID: identity.customerId, entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL } : { apiKey: key });
      return Purchases;
    }).catch(error => { initialization = undefined; throw error; });
  }
  return initialization;
}
export async function loadPremium() {
  const sdk = await initialize();
  const [offerings, info] = await Promise.all([sdk.getOfferings(), sdk.getCustomerInfo()]);
  return { packages: selectedPackages(offerings.all[OFFERING], billingMode() === 'test'), info };
}
export async function purchase(pkg: PurchasesPackage): Promise<CustomerInfo> {
  return (await (await initialize()).purchasePackage(pkg)).customerInfo;
}
export async function restore(): Promise<CustomerInfo> {
  return (await initialize()).restorePurchases();
}


export async function presentPaywall() {
  if (billingMode() !== 'test') throw new Error('unavailable');
  const sdk = await initialize();
  const offerings = await sdk.getOfferings();
  const offering = offerings.all[OFFERING];
  if (!offering) throw new Error('offering-unavailable');
  const RevenueCatUI = (require('react-native-purchases-ui') as typeof import('react-native-purchases-ui')).default;
  const result = await RevenueCatUI.presentPaywall({ offering, displayCloseButton: true });
  // The paywall result alone does not grant access; always check CustomerInfo.
  if (result === 'ERROR') throw new Error('paywall-error');
  const info = await sdk.getCustomerInfo();
  return { result, info };
}
