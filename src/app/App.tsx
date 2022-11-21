import React from 'react';

import MainPage from '@_pages/main';

import { AppProps } from './types';

// react functional component
export default function App(props: AppProps) {
  return <>
    <div style={{
      position: "absolute",

      width: "100%",
      height: "100%",

      background: "rgb(31, 36, 40)",
    }}>
      <MainPage />
    </div>
  </>
}
