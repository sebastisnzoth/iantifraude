import { Redirect } from 'expo-router';

// Mount a separate route so a second share refreshes an already-open editor.
export default function IncomingShare() {
  return <Redirect href="/(tabs)/analyze" />;
}
