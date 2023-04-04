import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import axios from "axios";
// import { SimpleKeyring } from '@unisat/bitcoin-simple-keyring'
import { FC, useCallback, useEffect, useState } from "react";
import "./App.css";
import FollowUsButton from "./assets/followUs_button.png";
import Heart from "./assets/heart.png";
import Logo from "./assets/logo.png";
import Mountains from "./assets/mountains.png";
import WalletButton from "./assets/wallet_button.png";
import WhitelistButton from "./assets/whitelist_button.png";

import {
  SignMessageResponse,
  WalletName
} from "@manahippo/aptos-wallet-adapter";
import Footer from "./components/Footer";
import Header from "./components/Header";
import WalletDialog from "./components/WalletDialog";
import { formatAddress } from "./utils/format";
import useBitcoinWallet from './hooks/useBitcoinWallet';

// const BACKEND_URL = 'http://localhost:5001/aptosland-3eff6/us-central1/verify';
const BACKEND_URL = 'http://localhost:3306/api/setAccountInfo/';

const DISCORD_URL = "https://discord.com/api/oauth2";
const SIGN_TEXT = "Please sign this message for https://connect.aptosland.io to verify your assets."

const App: FC = () => {
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [discordId, setDiscordId] = useState<string>();
  const { connect, connected, account, signMessage } = useBitcoinWallet();
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const getDiscordUser = useCallback(async (accessToken: string) => {
    const getUserResult = await axios.get(`${DISCORD_URL}/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setDiscordId(
      `${getUserResult.data.user.username}#${getUserResult.data.user.discriminator}`
    );
  }, []);

  useEffect(() => {
    const accessToken = window.location.hash
      ? window.location.hash.split("&")[1].split("=")[1]
      : "";

    let discordServerId: any;
    if (window.location.hash.includes("state")) {
      discordServerId = window.location.hash
        ? window.location.hash.split("&")?.[4]?.split("=")?.[1]
        : [""];
    } else {
      if (discordServerId == null) {
        discordServerId = window.location.pathname
          ? window.location.pathname.substring(1).split("/")?.[0]
          : [""];
      }
    }

    if (accessToken === "" || discordServerId === "") {
      setError("invalid discord authentication");
      return;
    }
    getDiscordUser(accessToken);

    if (connected) {
      setVerifying(true);
      signMessage(SIGN_TEXT)
        .then(async (signature: any) => {
          // const retVal = await verifyMessage(account.publicKey, SIGN_TEXT, signature);
          // console.log('[prince] verifyMessage', retVal)
          axios
            .post(BACKEND_URL, {
              accessToken,
              discordServerId,
              address: account?.address,
              signature: (signature as SignMessageResponse).signature,
              publicKey: account?.publicKey,
            })
            .then(() => setDone(true))
            .catch((error) => setError(error.message))
            .finally(() => setVerifying(false));
        })
        .catch((error: any) => {
          setError(error.message)
          console.log('Sign ERR', error)
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDiscordUser, connected]);

  const handleConnectWallet = (wallet: WalletName<string> | string | undefined) => {
    console.log('[prince] handleConnectWallet: ')
    if (wallet) {
      connect(wallet);
      setShowWalletDialog(false);
    }
  };

  if (done) {
    return (
      <div className="App">
        <Header />
        <div className="container">
          <img src={Heart} alt="logo" className="logo" />
          <div className="claim">Wallet Verified</div>
          <Typography variant="h4">
            Please check the Aptos Verification channel in
            <br />
            discord for your role status.
          </Typography>

          <Typography variant="h6" sx={{ marginTop: "60px" }}>
            Connect with us
          </Typography>

          <div className="verified-buttons">
            <a href="https://twitter.com/aptoslandnft">
              <img src={FollowUsButton} alt="follow us" />
            </a>
            <a href="https://discord.gg/pM25Sa67yX">
              <img src={WhitelistButton} alt="whitelist" />
            </a>
          </div>
        </div>
        <img src={Mountains} alt="mountains" className="mountains" />
        <Footer />
      </div>
    );
  }

  const AppWrapper: FC = ({ children }) => {
    return (
      <div className="App">
        <Header />
        <img src={Logo} alt="logo" className="logo" />
        <div className="claim">
          Welcome to Aptos Land
          <br />
          verification!
        </div>
        <Container maxWidth="sm" className="container">
          <div className="box">
            <div className="box-content">
              {done ? (
                <Typography
                  className="done"
                  variant="h5"
                  sx={{ marginBottom: "20px" }}
                >
                  verification done <br /> you can close this window and return
                  to discord
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h3"
                    color="secondary"
                    sx={{ fontWeight: 700, marginBottom: "10px" }}
                  >
                    Verify Ownership
                  </Typography>
                  <Typography variant="h5" sx={{ marginBottom: "20px" }}>
                    Connect your wallet to verify your assets.
                  </Typography>
                </>
              )}
              {children}
            </div>
          </div>
        </Container>
        <img src={Mountains} alt="mountains" className="mountains" />
        <Footer />
      </div>
    );
  };

  if (error) {
    return (
      <AppWrapper>
        <ErrorIcon color="error" sx={{ fontSize: "80px" }} />
        <Typography variant="h6">
          {error}
          <br />
          Please be patient and retry in a few minutes.
          <br />
          Thank you
        </Typography>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      {connected && (
        <Typography variant="body1">
          Wallet: {formatAddress(account?.address as string)}
        </Typography>
      )}
      {discordId && (
        <Typography variant="body1">Discord: {discordId}</Typography>
      )}
      {verifying === false ? (
        connected === false && (
          <img
            src={WalletButton}
            alt="wallet button"
            className="wallet-button"
            onClick={() => setShowWalletDialog(true)}
          />
        )
      ) : (
        <div style={{ marginTop: 20 }}>
          <CircularProgress
            sx={{ marginBottom: "10px" }}
            color="secondary"
            size="70px"
          />
          <Typography variant="body1">verifying your assets...</Typography>
        </div>
      )}
      <WalletDialog open={showWalletDialog} onClose={handleConnectWallet} />
    </AppWrapper>
  );
};

export default App;
