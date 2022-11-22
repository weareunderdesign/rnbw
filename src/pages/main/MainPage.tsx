import React, { useState } from 'react';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';

import { useSelector } from 'react-redux';

import { Spinner } from '@blueprintjs/core';


import { TUid } from '@_node/types';
import { globalGetPendingSelector } from '@_redux/global';

import { MainContext } from './context';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const [ffHandlers, setFFHandlers] = useState<{ [key: TUid]: FileSystemHandle }>({})

  const pending = useSelector(globalGetPendingSelector)
  
  const setFFHandler = (handlers: { uid: TUid, handler: FileSystemHandle }[]) => {
    let newHandlers: { [key: TUid]: FileSystemHandle } = {}
    handlers.map(({ uid, handler }) => {
      newHandlers[uid] = handler
    })
    setFFHandlers({ ...ffHandlers, ...newHandlers })
  }

  return (<>
    
    {pending &&
      <Spinner
        intent='success'
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: "9999",
          background: "rgba(0, 0, 0, 0.5)",
        }}
      />
    }
    
    <MainContext.Provider value={{ setHandler: setFFHandler, handlers: ffHandlers }}>
      <div style={{
        width: "calc(100% - 4rem)",
        height: "calc(100% - 4rem)",

        marginLeft: "2rem",
        marginRight: "2rem",
        marginBottom: "2rem",
        background: "rgb(36, 41, 46)",
        boxShadow: "1px 1px 5px 1px rgb(20, 20, 20)",

        display: "flex",
      }}>
        <ActionsPanel />
        <StageView />
        <CodeView />
      </div>
    </MainContext.Provider>
  </>)
}