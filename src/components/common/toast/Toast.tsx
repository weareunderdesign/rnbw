import './styles.css';

import React, { useMemo } from 'react';

import { ToastDuration } from '@_config/main';
import * as RToast from '@radix-ui/react-toast';

import ToastItem from './ToastItem';
import { ToastProps } from './types';

export default function Toast(props: ToastProps) {
  const messages = useMemo(() => props.messages, [props.messages])

  return <>
    <RToast.Provider duration={ToastDuration}>
      {messages.map((item, index) =>
        <ToastItem
          key={index}
          title={item.type}
          description={item.message}
        />
      )}
      <RToast.Viewport className='rtoast-viewport' />
    </RToast.Provider>
  </>
}