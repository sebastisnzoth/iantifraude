// Test Store configuration is included only in explicitly opted-in development builds.
module.exports = ({ config }) => {
  const enabled = process.env.ANTIGOLPE_RC_TEST === '1';
  const profile = process.env.EAS_BUILD_PROFILE;
  if (enabled && profile && profile !== 'development') {
    throw new Error('RevenueCat Test Store must not be included outside the development profile.');
  }
  const key = process.env.ANTIGOLPE_RC_TEST_KEY;
  if (enabled && (!key || !key.startsWith('test_'))) {
    throw new Error('A public RevenueCat Test Store key is required for test builds.');
  }
  return { ...config, extra: { ...config.extra, revenueCatTestKey: enabled ? key : undefined } };
};
