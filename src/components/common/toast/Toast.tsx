import './styles.css';

import React, { useEffect } from 'react';

import * as RToast from '@radix-ui/react-toast';

import ToastItem from './ToastItem';
import { useSelector } from 'react-redux';

import * as Main from '@_redux/main';
import { _Error } from '@_redux/main';

export default function Toast() {

  const toastItems = useSelector(Main.globalGetErrorSelector)
  
  return <>
    <RToast.Provider duration={5000}>
      {
        toastItems?.map((item: _Error, index: number) => {
          return <ToastItem key={index} index={index} title={item.type} description={item.errorMessage}/>
        })
      }
      <RToast.Viewport className='rtoast-viewport' />
    </RToast.Provider>
  </>
}