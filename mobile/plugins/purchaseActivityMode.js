exports.withPurchaseActivityMode = activity => {
  activity.$['android:launchMode'] = 'singleTop';
};
