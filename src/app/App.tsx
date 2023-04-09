import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import { Workbox } from 'workbox-window';

import { LogAllow } from '@_constants/main';
import MainPage from '@_pages/main';

import { AppProps } from './types';

export default function App(props: AppProps) {
  // setup nohost
  const [nohostReady, setNohostReady] = useState(false)
  useEffect(() => {
    if (!navigator.serviceWorker.controller) {
      setNohostReady(true)
    } else {
      if ('serviceWorker' in navigator) {
        const wb = new Workbox('/nohost-sw.js?route=rnbw')

        wb.controlling.then(() => {
          setNohostReady(true)
          LogAllow && console.log('nohost ready')
        })

        wb.addEventListener('installed', (event) => {
          if (!event.isUpdate) {
            LogAllow && console.log('nohost first time installed')
          }
        })

        wb.register()
      }
    }
  }, [])

  return useMemo(() => {
    return <>
      {nohostReady ? <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>
      </Router> : null}
    </>
  }, [nohostReady])
}

// extend global interfaces for nohost
declare global {
  interface Window {
    Filer: any,
  }
}

window.Filer = window.Filer