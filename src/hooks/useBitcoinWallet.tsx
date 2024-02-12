import { useCallback, useRef, useState } from "react";
import { AddressPurpose, BitcoinNetworkType, getAddress, signMessage as signMessageXverse } from 'sats-connect'

const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;

    const [walletName, setWalletName] = useState('');
    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [connected, setConnected] = useState(false);

    const [isSigningIn, setIsSigningIn] = useState(false);

    const signMessage = useCallback(async (message: string) => {
        let signedMessage_ = ''
        let publicKey_ = ''
        switch (walletName) {
            case 'Unisat':
                signedMessage_ = await (window as any).unisat.signMessage(message)
                console.log('signedMessage_: ', signedMessage_)
                alert(signedMessage_);
                break;
            case 'Xverse':
                const signMessageOptions = {
                    payload: {
                        network: {
                            type: BitcoinNetworkType.Testnet,
                        },
                        address,
                        message,
                    },
                    onFinish: (response: any) => {
                        // signature
                        signedMessage_ = response
                        console.log('signedMessage_: ', signedMessage_)
                        alert(response);
                    },
                    onCancel: () => alert("Canceled"),
                };
                await signMessageXverse(signMessageOptions);
                break
            case 'Leather':
                try {
                    const response = await (window as any).LeatherProvider.request('signMessage', {
                        message,
                        paymentType: 'p2tr',
                        network: 'testnet'
                    })
                    signedMessage_ = response.result.signature
                    console.log('signedMessage_: ', signedMessage_)
                    alert(signedMessage_);
                } catch (error) {

                }
                break;
            default:
                break;
        }
        return { signedMessage: signedMessage_, publicKey: publicKey_ }
    }, [walletName, address])

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
            case 'Leather':
            default:
                break;
        }
    }, [self, unisat]);

    const wallets = [
        'Xverse',
        'Unisat',
        'Leather'
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
                if (isSigningIn) {
                    console.warn('Attempted to sign in while sign is is in progress.');
                    return;
                }
                setIsSigningIn(true);
                const getAddressOptions = {
                    payload: {
                        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
                        message: 'Address for receiving Ordinals and payments',
                        network: {
                            type: BitcoinNetworkType.Testnet,
                        },
                    },
                    onFinish: (response: any) => {
                        console.log("onFinish Xverse connect", response)

                        setAddress(response.addresses[0].address)
                        setPublicKey(response.addresses[0].publicKey)
                        setConnected(true);
                    },
                    onCancel: () => {
                        console.log("onCancel Xverse connect")
                        setConnected(false);
                    },
                }

                await getAddress(getAddressOptions);
                setIsSigningIn(false);
                break;
            case 'Leather':
                console.log('Leather: ', (window as any))
                if (isSigningIn) {
                    console.warn('Attempted to sign in while sign is is in progress.');
                    return;
                }
                setIsSigningIn(true);

                const address = await (window as any).LeatherProvider.request('getAddresses', {
                    type: 'p2tr',
                    network: 'testnet'
                });
                console.log('Leather addresses: ', address)
                setAddress(address.result.addresses[1].address)
                setPublicKey(address.result.addresses[1].publicKey)
                setConnected(true);
                setIsSigningIn(false);
                break;
            default:
                break;
        }
    }, [unisat, handleAccountsChanged, isSigningIn]);

    return { wallet: walletName, connected, account: { address: address, publicKey: publicKey }, signMessage, wallets, connect, disconnect }
};

export default useBitcoinWallet;
