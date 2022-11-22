import React, { useState } from 'react';

import { useSelector } from 'react-redux';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';
import { TUid } from '@_node/types';
import { globalGetPendingSelector } from '@_redux/global';
import { Spinner } from '@blueprintjs/core';

import { MainContext } from './context';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const pending = useSelector(globalGetPendingSelector)

  // file system handlers - context
  const [ffHandlers, setFFHandlers] = useState<{ [key: TUid]: FileSystemHandle }>({})
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

        margin: "2rem",
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