import { useCallback, useRef, useState } from "react";
import { StacksSessionState, authenticate } from 'micro-stacks/connect'
// import create from 'zustand'

export const appDetails = {
    name: 'Bitcoin Land',
    icon: `bitcoinland/public/favicon.ico`,
}

const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;

    const [walletName, setWalletName] = useState('');
    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [connected, setConnected] = useState(false);

    const signMessage = useCallback(async (message: string) => {
        switch (walletName) {
            case 'Unisat':
                return (window as any).unisat.signMessage(message)
            case 'Xverse':
                return null;
            case 'Hiro':
                return null;
            default:
                return null;
        }
    }, [walletName])

    const selfRef = useRef<{ accounts: string[] }>({
        accounts: [],
    });
    const self = selfRef.current;
    const handleAccountsChanged = useCallback(async (name: string, data: string[] | StacksSessionState | any) => {
        console.log('[prince] handleAccountsChanged: ', name, data)
        switch (name) {
            case 'Unisat':
                const _accounts = data as string[]
                if (self.accounts[0] === _accounts[0]) {
                    // prevent from triggering twice
                    return;
                }
                self.accounts = _accounts;
                if (_accounts.length > 0) {

                    setAddress(_accounts[0]);

                    const [address] = await unisat.getAccounts();
                    setAddress(address);

                    const publicKey = await unisat.getPublicKey();
                    setPublicKey(publicKey);
                    setConnected(true);
                } else {
                    setConnected(false);
                }
                break;
            case 'Xverse':
                const _sessionXverse = data as any
                if (!_sessionXverse) return;
                if (_sessionXverse.profile.btcAddress.p2tr.mainnet && _sessionXverse.profile.btcPublickey.p2tr.mainnet) {
                    setAddress(_sessionXverse.profile.btcAddress.p2tr.mainnet)
                    setPublicKey(_sessionXverse.profile.btcPublickey.p2tr.mainnet)
                    setConnected(true);
                }
                break;
            case 'Hiro':
                const _sessionHiro = data as any
                if (!_sessionHiro) return;
                break;
            default:
                break;
        }
    }, [self, unisat]);

    const wallets = [
        'Xverse',
        'Unisat',
        'Hiro'
    ];

    const disconnect = useCallback(async (name: string) => {
        console.log('disconnect')
    }, []);

    const connect = useCallback(async (name: string) => {
        console.log('[prince] connect: ', name)
        setWalletName(name)
        switch (name) {
            case 'Unisat':
                const result = await unisat.requestAccounts();
                console.log('result: ', result)
                handleAccountsChanged(name, result);
                break;
            case 'Xverse':
                const _sessionXverse = await authenticate({ appDetails })
                console.log('session', _sessionXverse)
                if (!_sessionXverse) throw new Error('invalid session')
                handleAccountsChanged(name, _sessionXverse);
                break;
            case 'Hiro':
                const _sessionHiro = await authenticate({ appDetails })
                console.log('session', _sessionHiro)
                if (!_sessionHiro) throw new Error('invalid session')
                handleAccountsChanged(name, _sessionHiro);
                break;
            default:
                break;
        }
    }, [unisat, handleAccountsChanged]);

    return { connected, account: { address: address, publicKey: publicKey }, signMessage, wallets, connect, disconnect }
};

export default useBitcoinWallet;
