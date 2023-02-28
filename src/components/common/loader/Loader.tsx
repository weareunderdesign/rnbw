import React from 'react';

import { LoaderProps } from './types';

export const Loader = (props: LoaderProps) => {
  return <>
    <div className="position-absolute width-full height-xs z-index-1">
      <div className="loading-bar"></div>
    </div>
  </>
}