import React, { useEffect } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import { Workbox } from 'workbox-window';

import MainPage from '@_pages/main';

import { AppProps } from './types';

export default function App(props: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/nohost-sw.js?route=rnbw')

      // Wait on the server to be fully ready to handle routing requests
      wb.controlling.then(() => {
        console.log('Server ready! use `window.Filer.fs if you need an fs')
      })

      // Deal with first-run install, if necessary
      wb.addEventListener('installed', (event) => {
        if (!event.isUpdate) {
          console.log('Server installed for first time')
        }
      })

      wb.register()
    }
  }, [])

  return <>
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    </Router>
  </>
}

declare global {
  interface Window { Filer: any; }
}

window.Filer = window.Filer || {};