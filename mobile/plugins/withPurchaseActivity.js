const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');
const { withPurchaseActivityMode } = require('./purchaseActivityMode');

// A store may temporarily open another app for authentication. singleTask can
// cancel that purchase; RevenueCat recommends standard or singleTop.
module.exports = function withPurchaseActivity(config) {
  return withAndroidManifest(config, config => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    withPurchaseActivityMode(activity);
    return config;
  });
};
