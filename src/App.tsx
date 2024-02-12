import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import axios from "axios";
import { FC, useCallback, useEffect, useState } from "react";
import "./App.css";
import FollowUsButton from "./assets/followUs_button.png";
import Heart from "./assets/heart.png";
import Logo from "./assets/logo.png";
import Mountains from "./assets/mountains.png";
import WalletButton from "./assets/wallet_button.png";
import WhitelistButton from "./assets/whitelist_button.png";

// import {
//   SignMessageResponse,
//   WalletName
// } from "@manahippo/aptos-wallet-adapter";
import Footer from "./components/Footer";
import Header from "./components/Header";
import WalletDialog from "./components/WalletDialog";
import { formatAddress } from "./utils/format";
import useBitcoinWallet from './hooks/useBitcoinWallet';

// const BACKEND_URL = 'http://localhost:5001/aptosland-3eff6/us-central1/verify';
// const BACKEND_URL = 'https://tetra.tg.api.cryptosnowprince.com/bicoinland/setAccountInfo/';

const DISCORD_URL = "https://discord.com/api/oauth2";

const KIND_PLATINUM = 2;
const KIND_GOLD = 1;
const KIND_GENERAL = 0;

const ROLE_PITBOSS = 20; // 20+
const ROLE_SERGEANT = 10; // 10+
const ROLE_OFFICERS = 5; // 5+
const ROLE_METAZEN = 2; // 2+
const ROLE_PIONEER = 1; // 1
const ROLE_DWELLER = 0 // 0

const getStrFromRole = (version: number, kind: number) => {
  let versionStr = ""
  let kindStr = ""
  switch (version) {
    case ROLE_PITBOSS:
      versionStr = "PITBOSS";
      break;
    case ROLE_SERGEANT:
      versionStr = "SERGEANT";
      break;
    case ROLE_OFFICERS:
      versionStr = "OFFICERS";
      break;
    case ROLE_METAZEN:
      versionStr = "METAZEN";
      break;
    case ROLE_PIONEER:
      versionStr = "PIONEER";
      break;
    case ROLE_DWELLER:
    default:
      versionStr = "DWELLER";
      break;
  }
  switch (kind) {
    case KIND_PLATINUM:
      kindStr = "PLATINUM";
      break;
    case KIND_GOLD:
      kindStr = "GOLD";
      break;
    case KIND_GENERAL:
    default:
      kindStr = "GENERAL";
      break;
  }
  return { versionStr, kindStr };
}

const App: FC = () => {
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [discordId, setDiscordId] = useState<string>();
  const { connect, connected, account, signMessage, wallet, sendBTC } = useBitcoinWallet();
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

    // if (accessToken === "" || discordServerId === "") {
    //   setError("invalid discord authentication");
    //   return;
    // }
    getDiscordUser(accessToken);

    if (connected) {
      // signMessage Test

      // setVerifying(true);
      // const data = {
      //   accessToken: 'accessToken',
      //   discordServerId: 'discordServerId',
      //   date: 'datenow',
      //   // accessToken: accessToken,
      //   // discordServerId: discordServerId,
      //   // date: Date.now()
      // }
      // console.log("sign data: ", JSON.stringify(data))
      // signMessage(JSON.stringify(data))
      //   .then(async ({ signedMessage, publicKey }) => {
      //     console.log('[prince]: account', account.address, account.publicKey)
      //     axios.post(BACKEND_URL, {
      //       accessToken,
      //       discordServerId,
      //       address: account.address,
      //       publicKey: publicKey ? publicKey : account.publicKey,
      //       wallet,
      //       date: data.date,
      //       signature: signedMessage,
      //     })
      //       .then((res) => {
      //         setDone(true)
      //         console.log('[prince] res', res.data)
      //         const ret = getStrFromRole(res.data?.version, res.data?.kind)
      //         window.alert(`ROLE: ${ret.versionStr} ${ret.kindStr}`)
      //       })
      //       .catch((error) => setError(error.message))
      //       .finally(() => setVerifying(false));
      //   })
      //   .catch((error: any) => {
      //     setError(error.message)
      //     console.log('Sign ERR', error)
      //   });

      // sendBTC Test
      sendBTC('tb1qq0tfhxc8fan7e25t85njk3yehe686908q8a5hz', 1500, 1)
        .then((txId) => {
          console.log('sendBTC txId: ', txId)
        })
        .catch((err) => {
          console.log('sendBTC err: ', err)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDiscordUser, connected]);

  const handleConnectWallet = (wallet: string | undefined) => {
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
            Please check the Bitcoin Verification channel in
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
          Welcome to Bitcoin Land
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
