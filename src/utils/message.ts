import { SimpleKeyring } from '@unisat/bitcoin-simple-keyring'

export async function verifyMessage(publicKey: string, text: string, sig: string) {
    const keyring = new SimpleKeyring();
    return keyring.verifyMessage(publicKey, text, sig);
}