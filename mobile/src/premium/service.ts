import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { OFFERING, selectedPackages } from './core';

// Only a development client with an explicitly configured public Test Store key
// is allowed to initialize. Expo Go and web never use the native or mock SDK.
let initialization: Promise<typeof import('react-native-purchases').default> | undefined;
export function initialize() {
  if (!__DEV__ || Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return Promise.reject(new Error('unavailable'));
  }
  const key = Constants.expoConfig?.extra?.revenueCatTestKey;
  if (typeof key !== 'string' || !key.startsWith('test_')) return Promise.reject(new Error('unavailable'));
  if (!initialization) {
    initialization = Promise.resolve().then(() => {
      const Purchases = (require('react-native-purchases') as typeof import('react-native-purchases')).default;
      // No appUserID: RevenueCat assigns and persists its anonymous identifier.
      Purchases.configure({ apiKey: key });
      return Purchases;
    }).catch(error => { initialization = undefined; throw error; });
  }
  return initialization;
}
export async function loadPremium() {
  const sdk = await initialize();
  const [offerings, info] = await Promise.all([sdk.getOfferings(), sdk.getCustomerInfo()]);
  return { packages: selectedPackages(offerings.all[OFFERING]), info };
}
export async function purchase(pkg: PurchasesPackage): Promise<CustomerInfo> {
  return (await (await initialize()).purchasePackage(pkg)).customerInfo;
}
export async function restore(): Promise<CustomerInfo> {
  return (await initialize()).restorePurchases();
}

/** The paywall uses the existing default offering, never a fabricated fallback. */
export async function presentPaywall() {
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
