import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
const bitcore = require('bitcore-lib');
bitcoin.initEccLib(ecc);

export function formatAddress(address: string) {
    return `${address.substring(0, 4)}...${address.substring(
      address.length - 4
    )}`;
  }
  
export async function verifyMessage(publicKey: string, text: string, sig: string) {
    const message = new bitcore.Message(text);

    var signature = bitcore.crypto.Signature.fromCompact(
      Buffer.from(sig, "base64")
    );
    var hash = message.magicHash();

    // recover the public key
    var ecdsa = new bitcore.crypto.ECDSA();
    ecdsa.hashbuf = hash;
    ecdsa.sig = signature;

    const pubkeyInSig = ecdsa.toPublicKey();

    const pubkeyInSigString = new bitcore.PublicKey(
      Object.assign({}, pubkeyInSig.toObject(), { compressed: true })
    ).toString();
    if (pubkeyInSigString != publicKey) {
      return false;
    }

    return bitcore.crypto.ECDSA.verify(hash, signature, pubkeyInSig);
  }