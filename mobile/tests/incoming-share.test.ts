import * as Sharing from 'expo-sharing';
import { redirectSystemPath } from '../app/+native-intent';
import { takeDraft } from '../src/session';

jest.mock('expo-sharing', () => ({
  getSharedPayloads: jest.fn(), clearSharedPayloads: jest.fn(),
}));

test('incoming text goes to the editor without putting it in a URL', () => {
  jest.mocked(Sharing.getSharedPayloads).mockReturnValue([{ value: 'private message', shareType: 'text' }]);
  expect(redirectSystemPath({ path: 'antigolpe://expo-sharing', initial: true })).toBe('/incoming-share');
  expect(takeDraft()).toBe('private message');
  expect(Sharing.clearSharedPayloads).toHaveBeenCalled();
});

test('ordinary navigation and unsupported shares preserve privacy', () => {
  expect(redirectSystemPath({ path: '/help', initial: false })).toBe('/help');
  jest.mocked(Sharing.getSharedPayloads).mockReturnValue([{ value: 'file:///private', shareType: 'file' }]);
  expect(redirectSystemPath({ path: 'antigolpe://expo-sharing', initial: false })).toBe('/');
  expect(takeDraft()).toBe('');
});
