import './styles.css';

import React from 'react';

import { LoaderProps } from './types';

export const Loader = (props: LoaderProps) => {
  return <>
    <div className="loader">
      <div className="loaderBar"></div>
    </div>
  </>
}