import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { isPro, isCancelled, selectedPackages } from '../src/premium/core';
const info = (active: object) => ({entitlements:{active}} as CustomerInfo);
const pack = (identifier: string) => ({identifier,product:{priceString:'$12.34'}} as PurchasesPackage);
test('only the active configured entitlement grants Pro', () => {
 expect(isPro(info({}))).toBe(false);
 expect(isPro(info({other:{isActive:true}}))).toBe(false);
 expect(isPro(info({antigolpe_pro:{isActive:false}}))).toBe(false);
 expect(isPro(info({antigolpe_pro:{isActive:true}}))).toBe(true);
});
test('selects configured packages in order without invented prices', () => {
 const offering = {availablePackages:[pack('$rc_annual'),pack('other'),pack('$rc_monthly')]} as PurchasesOffering;
 expect(selectedPackages(offering).map(p=>p.identifier)).toEqual(['$rc_monthly','$rc_annual']);
 expect(selectedPackages(offering)[0].product.priceString).toBe('$12.34');
 expect(selectedPackages(undefined)).toEqual([]);
});
test('distinguishes user cancellation from failures', () => {
 expect(isCancelled({userCancelled:true})).toBe(true);
 expect(isCancelled({userCancelled:false})).toBe(false);
 expect(isCancelled(new Error('offline'))).toBe(false);
});
