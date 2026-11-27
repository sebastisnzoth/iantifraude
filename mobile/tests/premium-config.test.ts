const config = require('../app.config.js');
const original = {...process.env};
afterEach(()=>{process.env = {...original};});
test('production without test opt-in does not include the key',()=>{
 process.env.ANTIGOLPE_RC_GOOGLE_KEY='goog_example'; delete process.env.ANTIGOLPE_RC_TEST; process.env.EAS_BUILD_PROFILE='production';
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
