const { withPurchaseActivityMode } = require('../plugins/purchaseActivityMode');
test('uses a purchase-safe launch mode without altering other activity settings', () => {
 const activity = {$:{'android:name':'.MainActivity','android:launchMode':'singleTask','android:exported':'true'}};
 withPurchaseActivityMode(activity);
 expect(activity.$['android:launchMode']).toBe('singleTop');
 expect(activity.$['android:exported']).toBe('true');
});
