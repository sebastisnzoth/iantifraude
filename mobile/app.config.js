module.exports = ({ config }) => {
  const testEnabled = process.env.ANTIGOLPE_RC_TEST === '1';
  const profile = process.env.EAS_BUILD_PROFILE;
  const testKey = process.env.ANTIGOLPE_RC_TEST_KEY;
  const playKey = process.env.ANTIGOLPE_RC_GOOGLE_KEY;
  if (testEnabled && profile && profile !== 'development') {
    throw new Error('RevenueCat Test Store must not be included outside the development profile.');
  }
  if (testEnabled && !/^test_[a-zA-Z0-9]+$/.test(testKey || '')) {
    throw new Error('A public Test Store SDK key is required for test builds.');
  }
  if ((profile === 'production' || playKey) && !/^goog_[a-zA-Z0-9]+$/.test(playKey || '')) {
    throw new Error('Configure ANTIGOLPE_RC_GOOGLE_KEY with the public Google Play SDK key.');
  }
  return { ...config, extra: { ...config.extra,
    revenueCatTestKey: testEnabled ? testKey : undefined,
    revenueCatGoogleKey: testEnabled ? undefined : playKey,
  } };
};
