const config = require('../app.config.js');
const original = {...process.env};
afterEach(()=>{process.env = {...original};});
test('production without test opt-in does not include the key',()=>{
 delete process.env.ANTIGOLPE_RC_TEST; process.env.EAS_BUILD_PROFILE='production';
 expect(config({config:{extra:{}}}).extra.revenueCatTestKey).toBeUndefined();
});
test('production with test store enabled is rejected',()=>{
 process.env.ANTIGOLPE_RC_TEST='1'; process.env.ANTIGOLPE_RC_TEST_KEY='test_example'; process.env.EAS_BUILD_PROFILE='production';
 expect(()=>config({config:{extra:{}}})).toThrow('must not be included');
});
test('test development configuration accepts only a public test key',()=>{
 process.env.ANTIGOLPE_RC_TEST='1'; process.env.EAS_BUILD_PROFILE='development'; process.env.ANTIGOLPE_RC_TEST_KEY='test_example';
 expect(config({config:{extra:{}}}).extra.revenueCatTestKey).toBe('test_example');
 process.env.ANTIGOLPE_RC_TEST_KEY='secret'; expect(()=>config({config:{extra:{}}})).toThrow();
});

test('Google Play requires explicit opt-in and a public Android key in production',()=>{
 delete process.env.ANTIGOLPE_RC_TEST;
 process.env.EAS_BUILD_PROFILE='production'; process.env.ANTIGOLPE_RC_PLAY='1'; process.env.ANTIGOLPE_RC_PLAY_KEY='goog_example';
 expect(config({config:{extra:{}}}).extra.revenueCatPlayKey).toBe('goog_example');
 expect(config({config:{extra:{}}}).extra.revenueCatTestKey).toBeUndefined();
 process.env.ANTIGOLPE_RC_PLAY_KEY='test_example';
 expect(()=>config({config:{extra:{}}})).toThrow('public Google Play key');
});
test('Google Play cannot be enabled in preview or alongside Test Store',()=>{
 process.env.ANTIGOLPE_RC_PLAY='1'; process.env.ANTIGOLPE_RC_PLAY_KEY='goog_example'; delete process.env.ANTIGOLPE_RC_TEST;
 process.env.EAS_BUILD_PROFILE='preview';
 expect(()=>config({config:{extra:{}}})).toThrow('production profile');
 process.env.EAS_BUILD_PROFILE='development'; process.env.ANTIGOLPE_RC_TEST='1'; process.env.ANTIGOLPE_RC_TEST_KEY='test_example';
 expect(()=>config({config:{extra:{}}})).toThrow('cannot be combined');
});
test('no opt-in strips stale billing keys',()=>{
 delete process.env.ANTIGOLPE_RC_TEST; delete process.env.ANTIGOLPE_RC_PLAY;
 const extra=config({config:{extra:{revenueCatTestKey:'test_stale',revenueCatPlayKey:'goog_stale',eas:{projectId:'keep'}}}}).extra;
 expect(extra.revenueCatTestKey).toBeUndefined();
 expect(extra.revenueCatPlayKey).toBeUndefined();
 expect(extra.eas.projectId).toBe('keep');
});
