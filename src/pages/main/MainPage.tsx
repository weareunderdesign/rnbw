import React, { useState } from 'react';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';

import { MainPageProps } from './types';
import { MainContext } from './context';
import { TUid } from '@_node/types';

export default function MainPage(props: MainPageProps) {
  const [ffHandlers, setFFHandlers] = useState<{ [key: TUid]: FileSystemHandle }>({})

  const setFFHandler = (handlers: { uid: TUid, handler: FileSystemHandle }[]) => {
    let newHandlers: { [key: TUid]: FileSystemHandle } = {}
    for (const x in ffHandlers) {      
      newHandlers[x] = ffHandlers[x]
    }
    handlers.map(({uid, handler}) => {
      newHandlers[uid] = handler
    })
    setFFHandlers(newHandlers)
  }

  return (<>
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