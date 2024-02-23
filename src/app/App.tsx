import React, { useEffect, useMemo, useState } from "react";

import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Workbox } from "workbox-window";

import { LogAllow } from "@_constants/global";
import MainPage from "@_pages/main";

export default function App() {
  // setup nohost-serviceworker
  const [nohostReady, setNohostReady] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const wb = new Workbox("/nohost-sw.js?route=rnbw");
      wb.register().then(() => {
        setNohostReady(true);
        LogAllow && console.log("nohost ready");
      });
    }
  }, []);

  return useMemo(() => {
    return (
      <>
        {nohostReady ? (
          <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/:project/*" element={<MainPage />} />
            </Routes>
          </Router>
        ) : null}
      </>
    );
  }, [nohostReady]);
}

// extend global interfaces for nohost
declare global {
  interface Window {
    Filer: any;
  }
}
window.Filer = window.Filer;
