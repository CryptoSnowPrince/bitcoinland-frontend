import { useCallback, useRef, useState } from "react";
import { AddressPurpose, BitcoinNetworkType, getAddress, signMessage as signMessageXverse, sendBtcTransaction, signTransaction } from 'sats-connect'
import axios from "axios";
import { Buffer } from 'buffer';
// import { Psbt, networks } from 'bitcoinjs-lib';
window.Buffer = Buffer; // Make Buffer available globally

const { Psbt, networks } = require('bitcoinjs-lib');


const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;

    const [walletName, setWalletName] = useState('');
    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [paymentAddress, setPaymentAddress] = useState("");
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

    const sendBTC = useCallback(async (toAddress: string, satoshis: number, feeRate: number) => {
        let txId = ''
        switch (walletName) {
            case 'Unisat':
                console.log("SendBTC window: ", (window as any))
                console.log("SendBTC: ", (window as any).unisat.sendBitcoin)
                txId = await (window as any).unisat.sendBitcoin(toAddress, satoshis, {
                    feeRate,
                })
                console.log('SendBTC: ', txId)
                alert(txId);
                break;
            case 'Xverse':
                const sendBtcOptions = {
                    payload: {
                        network: {
                            type: BitcoinNetworkType.Testnet,
                        },
                        recipients: [
                            {
                                address: toAddress,
                                amountSats: BigInt(satoshis),
                            },
                        ],
                        senderAddress: paymentAddress,
                    },
                    onFinish: (response: any) => {
                        txId = response
                        alert(response);
                    },
                    onCancel: () => alert("Canceled"),
                };

                await sendBtcTransaction(sendBtcOptions);
                break
            case 'Leather':
                try {
                    const resp = await await (window as any).LeatherProvider.request('sendTransfer', {
                        address: toAddress,
                        amount: satoshis,
                        network: 'testnet',
                    });

                    console.log(resp.result.txid)
                    txId = resp.result.txid
                    alert(resp.result.txid)
                } catch (error) {

                }
                break;
            default:
                break;
        }
        return { txId }
    }, [walletName, paymentAddress])

    const splitUtxoTx = useCallback(async (broadcast: boolean) => {
        if (!paymentAddress) {
            return
        }
        // Get utxo list from sender
        const utxoList = await axios.get(
            `https://blockstream.info/testnet/api/address/${paymentAddress}/utxo`
        );
        const psbt = new Psbt({ network: networks.testnet })

        let idx
        for (idx = 0; idx < utxoList.data.length; idx++) {

            if (utxoList.data[idx].value < 20000)
                continue;

            const responseRaw = await axios.get(
                `https://blockstream.info/testnet/api/tx/${utxoList.data[idx].txid}/hex`
            );

            psbt.addInput({
                hash: utxoList.data[idx].txid,
                index: parseInt(utxoList.data[idx].vout),
                nonWitnessUtxo: Buffer.from(responseRaw.data, 'hex')
            })
            break;
        }

        for (let idx2 = 0; idx2 < 3; idx2++) {
            psbt.addOutput({
                address: paymentAddress,
                value: 600,
            });
        }
        psbt.addOutput({
            address: paymentAddress,
            value: utxoList.data[idx].value - 600 * 3 - 420,
        });
        const tx = psbt.toHex();

        let txId = ''
        switch (walletName) {
            case 'Unisat':
                const signedPsbt = await (window as any).unisat.signPsbt(tx);
                console.log('splitUtxoTx signedPsbt: ', signedPsbt)
                alert(signedPsbt);
                if (broadcast) {
                    txId = await (window as any).unisat.pushPsbt(signedPsbt);
                    console.log('splitUtxoTx pushPsbt: ', txId)
                    alert(txId);
                }
                break;
            case 'Xverse':
                // TODO with sats-connect-example
                const signPsbtOptions = {
                    payload: {
                        message: '',
                        network: {
                            type: BitcoinNetworkType.Testnet
                        },
                        psbtBase64: psbt.toBase64(),
                        broadcast,
                        inputsToSign: [{
                            address: paymentAddress,
                            signingIndexes: [0],
                        }],
                    },
                    onFinish: (response: any) => {
                        console.log('Canceled')
                        console.log(response)
                        txId = response.txId
                        alert(txId)
                    },
                    onCancel: () => {
                        console.log('Canceled')
                        alert('Canceled')
                    },
                }

                try {
                    await signTransaction(signPsbtOptions);
                } catch (error) {
                    console.log('splitUtxoTx err: ', error)
                }
                break
            case 'Leather':
                try {
                    console.log('splitUtxoTx Leather: ')
                    const requestParams = {
                        hex: tx,
                        network: 'testnet',
                        broadcast
                    };

                    const signedPsbt = await (window as any).LeatherProvider.request('signPsbt', requestParams);
                    console.log('splitUtxoTx signPsbt: ', signedPsbt)
                    alert(signedPsbt)
                } catch (error) {
                    console.log('splitUtxoTx err: ', error)
                }
                break;
            default:
                break;
        }
        return txId
    }, [walletName, paymentAddress])

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
                    setPaymentAddress(_accounts[0]);

                    const [address] = await unisat.getAccounts();
                    setAddress(address);
                    setPaymentAddress(address);

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

                        const ordinalsAddress = response.addresses.find((address: any) => address.purpose === "ordinals")
                        const paymentAddress = response.addresses.find((address: any) => address.purpose === "payment")

                        setAddress(ordinalsAddress.address)
                        setPaymentAddress(paymentAddress.address)
                        setPublicKey(ordinalsAddress.publicKey)
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

                const response = await (window as any).LeatherProvider.request('getAddresses', {
                    type: 'p2tr',
                    network: 'testnet'
                });
                console.log('Leather addresses: ', response)
                const ordinalsAddress = response.result.addresses.find((address: any) => address.type === "p2tr")
                const paymentAddress = response.result.addresses.find((address: any) => address.type === "p2wpkh")
                setAddress(ordinalsAddress.address)
                setPublicKey(ordinalsAddress.publicKey)
                setPaymentAddress(paymentAddress.address)
                setConnected(true);
                setIsSigningIn(false);
                break;
            default:
                break;
        }
    }, [unisat, handleAccountsChanged, isSigningIn]);

    return {
        wallet: walletName,
        connected,
        account: { address, paymentAddress, publicKey },
        signMessage,
        sendBTC,
        wallets,
        connect,
        disconnect,
        splitUtxoTx
    }
};

export default useBitcoinWallet;
