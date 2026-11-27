import { financialSignals } from '../src/premium/financial';
import { analysisHosts, createReputationLookup, CERT_FEED } from '../src/premium/reputation';
import { modelReply } from '../src/ai/assistant';

test('ordinary loan discussion and an advance fee produce distinct results', () => {
  expect(financialSignals('Me ofrecieron un préstamo')).toHaveLength(0);
  expect(financialSignals('Me ofrecieron un préstamo con una tasa de liberación')[0].id).toBe('financial_loan');
});

test('domain checks download a fixed feed once and never access the submitted website', async () => {
  const download = jest.fn(async () => ({ok:true,headers:{ get: () => null },text: async () => 'listed.example\n'} as Response));
  const lookup = createReputationLookup(download);
  const hosts = analysisHosts('https://sub.listed.example/secret?private=1', true);
  expect((await lookup(hosts)).listed).toEqual(['sub.listed.example']);
  expect((await lookup(['other.example'])).listed).toEqual([]);
  expect(download).toHaveBeenCalledTimes(1);
  expect(download).toHaveBeenCalledWith(CERT_FEED, expect.anything());
});

test('assistant rejects explanations unsupported by the message', () => {
  expect(() => modelReply({signals:[{tactic:'pressure',quote:'invented'}]}, 'hola', 'es')).toThrow();
});
