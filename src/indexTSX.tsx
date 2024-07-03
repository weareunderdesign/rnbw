import "./rnbw.css";
import "@rnbws/renecss/dist/rene.min.css";
import "@rnbws/svg-icon.js";

import React, { useEffect, useMemo, useState } from "react";
import * as ReactDOMClient from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Workbox } from "workbox-window";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";

import configureStore from "@_redux/_root";
import MainPage from "./MainPage";

// Constants
export const RootNodeUid = "ROOT";
export const DefaultProjectPath = "/untitled";
export const StagePreviewPathPrefix = "rnbw-stage-preview-";
export const CodeViewSyncDelay = 100;
export const CodeViewSyncDelay_Long = 1 * 1000;
export const AutoSaveDelay = 5000;

export const ParsableFileTypes: { [fileType: string]: true } = {
  html: true,
  css: true,
  js: true,
  txt: true,
  json: true,
  md: true,
  xml: true,
  svg: true,
};

export const RenderableFileTypes: { [fileType: string]: true } = {
  html: true,
};

export const AddActionPrefix = "AddAction";
export const AddFileActionPrefix = `${AddActionPrefix}-File`;
export const TmpFileNodeUidWhenAddNew = "tmp:node:uid";
export const AddNodeActionPrefix = `${AddActionPrefix}-Node`;

export const RenameActionPrefix = "RenameAction";
export const RenameFileActionPrefix = `${RenameActionPrefix}-File`;
export const RenameNodeActionPrefix = `${RenameActionPrefix}-Node`;

export const DefaultTabSize = 2;
export const RecentProjectCount = 10;
export const ShortDelay = 50;
export const NodePathSplitter = "?";
export const FileChangeAlertMessage = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;

export const DargItemImage = new Image();
DargItemImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

export const RainbowAppName = "rnbw";
export const LogAllow = true;

function App() {
  const [nohostReady, setNohostReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const wb = new Workbox("/nohost-sw.js?route=rnbw");
      wb.register().then(() => {
        setNohostReady(true);
        LogAllow && console.log("nohost ready");
      });
      window.location.href = "/#";
    }
  }, []);

  return useMemo(() => (
    <>
      {nohostReady && (
        <Router>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/:project/*" element={<MainPage />} />
          </Routes>
        </Router>
      )}
    </>
  ), [nohostReady]);
}

// configure store
const store = configureStore({});
const persistor = persistStore(store);

// render #root
const root = ReactDOMClient.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);

export default App;