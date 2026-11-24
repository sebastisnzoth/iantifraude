import { initialize, loadPremium, purchase, restore, presentPaywall } from '../src/premium/service';
import { isPro } from '../src/premium/core';
const customer = {entitlements:{active:{antigolpe_pro:{isActive:true}}}};
const mockSdk = {
 configure: jest.fn(),
 getOfferings: jest.fn(async()=>({all:{default:{availablePackages:[{identifier:'$rc_monthly', product:{priceString:'$1.00'}}]}}})),
 getCustomerInfo: jest.fn(async()=>customer),
 purchasePackage: jest.fn(async()=>({customerInfo:customer})),
 restorePurchases: jest.fn(async()=>customer),
};
jest.mock('expo-constants',()=>({__esModule:true, default:{executionEnvironment:'standalone',expoConfig:{extra:{revenueCatTestKey:'test_example'}}}, ExecutionEnvironment:{StoreClient:'storeClient'}}));
const mockUI = { presentPaywall: jest.fn(async () => 'PURCHASED') };
jest.mock('react-native-purchases-ui',()=>({__esModule:true,default:mockUI}));
jest.mock('react-native-purchases',()=>({__esModule:true,default:mockSdk}));
test('initializes once, fetches real package data and handles purchase and restore responses',async()=>{
 await Promise.all([initialize(),initialize()]);
 expect(mockSdk.configure).toHaveBeenCalledTimes(1);
 expect(mockSdk.configure).toHaveBeenCalledWith({apiKey:'test_example'});
 const result = await loadPremium();
 expect(result.packages[0].product.priceString).toBe('$1.00');
 expect(isPro(await purchase(result.packages[0]))).toBe(true);
 expect(isPro(await restore())).toBe(true);
});
test('web never initializes even if a Test Store key is configured',async()=>{
 const { Platform } = require('react-native');
 const previous = Platform.OS;
 Platform.OS = 'web';
 try { await expect(initialize()).rejects.toThrow('unavailable'); }
 finally { Platform.OS = previous; }
 expect(mockSdk.configure).toHaveBeenCalledTimes(1);
});

test('paywall uses the default offering and refreshes customer information', async()=>{
 const value = await presentPaywall();
 expect(mockUI.presentPaywall).toHaveBeenCalledWith({offering: expect.objectContaining({availablePackages: expect.any(Array)}), displayCloseButton:true});
 expect(value.result).toBe('PURCHASED');
 expect(isPro(value.info)).toBe(true);
});
test('paywall errors are not treated as a purchase',async()=>{
 mockUI.presentPaywall.mockResolvedValueOnce('ERROR');
 await expect(presentPaywall()).rejects.toThrow('paywall-error');
});
test('paywall fails closed when default offering is missing',async()=>{
 mockSdk.getOfferings.mockResolvedValueOnce({all:{}} as never);
 await expect(presentPaywall()).rejects.toThrow('offering-unavailable');
});

test('an expired or absent entitlement does not grant access after purchase or restore', async()=>{
 const inactive = {entitlements:{active:{}}};
 mockSdk.purchasePackage.mockResolvedValueOnce({customerInfo:inactive} as never);
 mockSdk.restorePurchases.mockResolvedValueOnce(inactive as never);
 const pkg = (await loadPremium()).packages[0];
 expect(isPro(await purchase(pkg))).toBe(false);
 expect(isPro(await restore())).toBe(false);
});
test('cancelled purchases and network errors propagate without inventing success',async()=>{
 const cancelled = {userCancelled:true};
 mockSdk.purchasePackage.mockRejectedValueOnce(cancelled);
 const pkg = (await loadPremium()).packages[0];
 await expect(purchase(pkg)).rejects.toEqual(cancelled);
 mockSdk.restorePurchases.mockRejectedValueOnce(new Error('offline'));
 await expect(restore()).rejects.toThrow('offline');
});
test('paywall cancellation does not invent an active entitlement',async()=>{
 mockUI.presentPaywall.mockResolvedValueOnce('CANCELLED');
 mockSdk.getCustomerInfo.mockResolvedValueOnce({entitlements:{active:{}}} as never);
 const result = await presentPaywall();
 expect(result.result).toBe('CANCELLED');
 expect(isPro(result.info)).toBe(false);
});
