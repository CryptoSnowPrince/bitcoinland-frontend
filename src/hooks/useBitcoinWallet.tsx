import { useCallback, useEffect, useRef, useState } from "react";

const useBitcoinWallet = () => {
    const unisat = (window as any).unisat;

    const [unisatInstalled, setUnisatInstalled] = useState(false);
    const [connected, setConnected] = useState(false);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
    });
    const [network, setNetwork] = useState("livenet");

    const getBasicInfo = async () => {
        const unisat = (window as any).unisat;
        const [address] = await unisat.getAccounts();
        setAddress(address);

        const publicKey = await unisat.getPublicKey();
        setPublicKey(publicKey);

        const balance = await unisat.getBalance();
        setBalance(balance);

        const network = await unisat.getNetwork();
        setNetwork(network);
    };

    const selfRef = useRef<{ accounts: string[] }>({
        accounts: [],
    });
    const self = selfRef.current;
    const handleAccountsChanged = useCallback((_accounts: string[]) => {
        if (self.accounts[0] === _accounts[0]) {
            // prevent from triggering twice
            return;
        }
        self.accounts = _accounts;
        if (_accounts.length > 0) {
            setAccounts(_accounts);
            setConnected(true);

            setAddress(_accounts[0]);

            getBasicInfo();
        } else {
            setConnected(false);
        }
    }, [self]);

    // const handleNetworkChanged = (network: string) => {
    //     setNetwork(network);
    //     getBasicInfo();
    // };

    // useEffect(() => {
    //     const unisat = (window as any).unisat;
    //     if (unisat) {
    //         setUnisatInstalled(true);
    //     } else {
    //         return;
    //     }
    //     unisat.getAccounts().then((accounts: string[]) => {
    //         handleAccountsChanged(accounts);
    //     });

    //     unisat.on("accountsChanged", handleAccountsChanged);
    //     unisat.on("networkChanged", handleNetworkChanged);

    //     return () => {
    //         unisat.removeListener("accountsChanged", handleAccountsChanged);
    //         unisat.removeListener("networkChanged", handleNetworkChanged);
    //     };
    // }, []);

    const signMessage = (window as any).unisat.signMessage;
    const wallets = [
        // 'Xverse',
        'Unisat',
        // 'Hiro'
    ];

    const disconnect = useCallback(async () => {
        console.log('disconnect')
    }, []);

    const connect = useCallback(async (name: string) => {
        switch (name) {
            case 'Unisat':
                console.log('connect')
                const result = await unisat.requestAccounts();
                console.log('result', result)
                handleAccountsChanged(result);
                break;
            default:
                break;
        }
    }, [unisat, handleAccountsChanged]);

    return { connected, account: {address: address, publicKey: publicKey}, signMessage, wallets, connect, disconnect }
};

export default useBitcoinWallet;
