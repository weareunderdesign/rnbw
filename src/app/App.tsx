import React from 'react';

import MainPage from '@_pages/main';

import { AppProps } from './types';

// react functional component
export default function App(props: AppProps) {
  return <>
    <div style={{
      position: "fixed",

      top: "0px",
      left: "0px",
      width: "100%",
      height: "100%",

      background: "rgb(31, 36, 40)",
    }}>
      <MainPage />
    </div>
  </>
}
