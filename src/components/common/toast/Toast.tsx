import './styles.css';

import React from 'react';

import * as RToast from '@radix-ui/react-toast';

import { ToastProps } from './types';

export default function Toast(props: ToastProps) {
  return <>
    <RToast.Provider>
      <RToast.Root className='rtoast-root' open={props.open}>
        <RToast.Title />
        <RToast.Description />
        <RToast.Action altText='123' />
        <RToast.Close />
      </RToast.Root>

      <RToast.Viewport className='rtoast-viewport' />
    </RToast.Provider>
  </>
}