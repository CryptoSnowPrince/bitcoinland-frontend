import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
// import * as MicroStacks from '@micro-stacks/react';
globalThis.Buffer = Buffer;

const THEME = createTheme({
  palette: {
    primary: { main: '#00000' },
    secondary: { main: '#2ED8A7' }
  },
  typography: {
    fontFamily: `'Montserrat', sans-serif`,
    fontSize: 10,
  },
});

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={THEME}>
      {/* <MicroStacks.ClientProvider
        appName="Bitcoin land"
        appIconUrl="https://aptosland.io/favicon.ico"
      > */}
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
      {/* </MicroStacks.ClientProvider> */}
    </ThemeProvider>
  </React.StrictMode>,
  document.querySelector("#root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
