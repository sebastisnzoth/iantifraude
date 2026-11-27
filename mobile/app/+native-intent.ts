import { clearSharedPayloads, getSharedPayloads } from 'expo-sharing';
import { setDraft } from '../src/session';
import { sanitizeText } from '../src/validation';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (!/^antigolpe:\/\/expo-sharing(?:[/?#]|$)/i.test(path)) return path;
  try {
    const item = getSharedPayloads().find(({ shareType }) =>
      shareType === 'text' || shareType === 'url' || shareType === undefined
    );
    if (item?.value) {
      setDraft(sanitizeText(item.value));
      return '/incoming-share';
    }
  } catch {
    return '/';
  } finally {
    try { clearSharedPayloads(); } catch { /* Native sharing may be unavailable. */ }
  }
  return '/';
}
