import './index.scss';

import React from 'react';

import * as ReactDOMClient from 'react-dom/client';
import { Provider } from 'react-redux';

import App from '@app/index';
import configureStore from '@redux/_root';

// configure store
const initialState = {};
const store = configureStore(initialState);

// render #root
const root = ReactDOMClient.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
  // </React.StrictMode>
);