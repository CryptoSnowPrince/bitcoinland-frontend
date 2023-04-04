import { useCallback, useRef, useState } from "react";
import { AppConfig, SignatureData, UserSession, showConnect, openSignatureRequestPopup as signMessageHiro } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { AddressPurposes, getAddress } from 'sats-connect'

import { verifyMessageSignatureRsv } from '@stacks/encryption';

//////////////////////////////
// Xverse Wallet
//////////////////////////////

//////////////////////////////
// Hiro Wallet
//////////////////////////////

export const appDetails = {
    name: 'Bitcoin Land',
    icon: `https://aptosland.io/favicon.ico`,
}

const networkName = 'mainnet'

const appConfig = new AppConfig(['store_write']);
const userSession = new UserSession({ appConfig });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAccountInfo(userData: any, network: string) {
    // NOTE: Although this approach to obtain the user's address is good enough for now, it is quite brittle.
    // It relies on a variable having the same value as the object key below. Type checking is not available given the `userSession` object managed by `@stacks/connect` is typed as `any`.
    //
    // Should this be a source of issues, it may be worth refactoring.
    const btcAddressP2tr: string = userData?.profile?.btcAddress?.p2tr?.[network];
    const btcPublicKeyP2tr: string = userData?.profile?.btcPublicKey?.p2tr;

    return { btcAddressP2tr, btcPublicKeyP2tr };
}

//////////////////////////////
// Unisat Wallet
//////////////////////////////

//////////////////////////////
// Wallets
//////////////////////////////
const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;

    const [walletName, setWalletName] = useState('');
    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [connected, setConnected] = useState(false);

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [hasSearchedForExistingSession, setHasSearchedForExistingSession] = useState(false);

    const signMessage = useCallback(async (message: string) => {
        let signedMessage_ = ''
        let publicKey_ = ''
        switch (walletName) {
            case 'Unisat':
                signedMessage_ = await (window as any).unisat.signMessage(message)
                break;
            case 'Xverse':
            case 'Hiro':
                await signMessageHiro({
                    message,
                    network: new StacksMainnet(),
                    userSession,
                    onFinish(data: SignatureData) {
                        console.log('SignatureData: ', data)
                        signedMessage_ = data.signature
                        publicKey_ = data.publicKey
                        setPublicKey(data.publicKey)
                    }
                });
                break;
            default:
                break;
        }
        return { signedMessage: signedMessage_, publicKey: publicKey_ }
    }, [walletName])

    const selfRef = useRef<{ accounts: string[] }>({
        accounts: [],
    });
    const self = selfRef.current;
    const handleAccountsChanged = useCallback(async (name: string, data: string[] | any) => {
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
            case 'Hiro':
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
                // Need Double wallet connection
                if (isSigningIn) {
                    console.warn('Attempted to sign in while sign is is in progress.');
                    return;
                }
                setIsSigningIn(true);
                await getAddress({
                    payload: {
                        purposes: [AddressPurposes.ORDINALS, AddressPurposes.PAYMENT],
                        message: 'Address for receiving Ordinals and payments',
                        network: {
                            type: 'Mainnet',
                            address: 'Mainnet'
                        },
                    },
                    onFinish: (response: any) => {
                        console.log("onFinish Xverse connect", response)

                        setAddress(response.addresses[0].address)
                        setPublicKey(response.addresses[0].publicKey)
                    },
                    onCancel: () => {
                        console.log("onCancel Xverse connect")
                    },
                });
                showConnect({
                    userSession,
                    appDetails,
                    onFinish() {
                        let userData = null;
                        try {
                            userData = userSession.loadUserData();
                            console.log("onFinish Xverse connect2", userSession, userData)
                        } catch {
                            // do nothing
                        }
                        setIsSigningIn(false);
                        setConnected(true);
                    },
                    onCancel() {
                        setIsSigningIn(false);
                        setConnected(false);
                    },
                });
                break;
            case 'Hiro':
                if (isSigningIn) {
                    console.warn('Attempted to sign in while sign is is in progress.');
                    return;
                }
                setIsSigningIn(true);
                showConnect({
                    userSession,
                    appDetails,
                    onFinish() {
                        setIsSigningIn(false);

                        let userData = null;
                        try {
                            userData = userSession.loadUserData();
                        } catch {
                            // do nothing
                        }

                        const retVal = getAccountInfo(userData, networkName);
                        console.log("onFinish connect", userData, retVal)
                        setAddress(retVal.btcAddressP2tr as string)
                        setConnected(true);
                    },
                    onCancel() {
                        setIsSigningIn(false);
                        if (!hasSearchedForExistingSession) {
                            if (userSession.isUserSignedIn()) {
                                let userData = null;
                                try {
                                    userData = userSession.loadUserData();
                                } catch {
                                    // do nothing
                                }

                                const retVal2 = getAccountInfo(userData, networkName);
                                setAddress(retVal2.btcAddressP2tr as string)
                                setConnected(true);
                            }

                            setHasSearchedForExistingSession(true);
                        }
                    },
                });
                break;
            default:
                break;
        }
    }, [unisat, handleAccountsChanged, isSigningIn, hasSearchedForExistingSession]);

    return { wallet: walletName, connected, account: { address: address, publicKey: publicKey }, signMessage, wallets, connect, disconnect }
};

export default useBitcoinWallet;
