import { requireNativeModule } from 'expo';

type InstallationKey = { customerId: string; publicKey: string };
type SignedRequest = { nonce: string; time: string; signature: string };

function nativeIdentity() {
  return requireNativeModule<{
    identity(): Promise<InstallationKey>;
    signRequest(body: string): Promise<SignedRequest>;
  }>('AntiGolpeIdentity');
}

export function installationIdentity() {
  return nativeIdentity().identity();
}

export async function signRequest(body: string) {
  const [identity, proof] = await Promise.all([installationIdentity(), nativeIdentity().signRequest(body)]);
  return { ...identity, ...proof };
}
