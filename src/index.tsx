import "./rnbw.css";
import "renecss/dist/rene.min.css";

import React from "react";

import * as ReactDOMClient from "react-dom/client";
import { Provider } from "react-redux";

import configureStore from "@_redux/_root";

import App from "./app";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";

// configure store
const initialState = {};
const store = configureStore(initialState);
const persistor = persistStore(store);
// render #root
const root = ReactDOMClient.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
);
