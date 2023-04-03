import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import {
  WalletProvider,
  HippoWalletAdapter,
  AptosWalletAdapter,
  HippoExtensionWalletAdapter,
  MartianWalletAdapter,
  FewchaWalletAdapter,
  PontemWalletAdapter,
  SpikaWalletAdapter,
  RiseWalletAdapter,
  FletchWalletAdapter,
  TokenPocketWalletAdapter,
  ONTOWalletAdapter,
  BloctoWalletAdapter,
  SafePalWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";
const wallets = [
  new HippoWalletAdapter(),
  new MartianWalletAdapter(),
  new AptosWalletAdapter(),
  new FewchaWalletAdapter(),
  new HippoExtensionWalletAdapter(),
  new PontemWalletAdapter(),
  // new SpikaWalletAdapter(),
  // new RiseWalletAdapter(),
  // new FletchWalletAdapter(),
  // new TokenPocketWalletAdapter(),
  // new ONTOWalletAdapter(),
  // new BloctoWalletAdapter(),
  // new SafePalWalletAdapter(),
];

globalThis.Buffer = Buffer;

const THEME = createTheme({
  palette: {
    primary: {main: '#00000'},
    secondary: {main: '#2ED8A7'}
  },
  typography: {
    fontFamily: `'Montserrat', sans-serif`,
    fontSize: 10,
  },
});

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={THEME}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error: Error) => {
          console.log("Handle Error Message", error);
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.querySelector("#root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
