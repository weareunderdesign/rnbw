import "./rnbw.css";

import React from "react";

import * as ReactDOMClient from "react-dom/client";
import { Provider } from "react-redux";

import configureStore from "@_redux/_root";

import App from "./app";

// configure store
const initialState = {};
const store = configureStore(initialState);

// render #root
const root = ReactDOMClient.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
