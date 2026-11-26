// Billing is opt-in. Never embed Test Store credentials in release builds.
module.exports = ({ config }) => {
  const enabled = process.env.ANTIGOLPE_RC_TEST === '1';
  const playEnabled = process.env.ANTIGOLPE_RC_PLAY === '1';
  const profile = process.env.EAS_BUILD_PROFILE;
  if (enabled && playEnabled) throw new Error('Test Store and Google Play cannot be combined.');
  if (enabled && profile && profile !== 'development') {
    throw new Error('RevenueCat Test Store must not be included outside the development profile.');
  }
  if (playEnabled && profile !== 'production') {
    throw new Error('Google Play billing must use the production profile.');
  }
  const key = process.env.ANTIGOLPE_RC_TEST_KEY;
  const playKey = process.env.ANTIGOLPE_RC_PLAY_KEY;
  if (enabled && (!key || !key.startsWith('test_'))) {
    throw new Error('A public RevenueCat Test Store key is required for test builds.');
  }
  if (playEnabled && (!playKey || !/^goog_[A-Za-z0-9_]+$/.test(playKey))) {
    throw new Error('A public Google Play key is required for Play billing.');
  }
  return { ...config, extra: { ...config.extra, revenueCatTestKey: enabled ? key : undefined, revenueCatPlayKey: playEnabled ? playKey : undefined } };
};
