import React, { useState } from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  ActionsPanel,
  CodeView,
  HmsModule,
  StageView,
} from '@_components/main';
import { TUid } from '@_node/types';
import {
  globalGetCurrentFileSelector,
  globalGetPendingSelector,
  setGlobalPending,
} from '@_redux/global';
import { verifyPermission } from '@_services/global';
import { Spinner } from '@blueprintjs/core';

import { MainContext } from './context';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // fetch global state
  const pending = useSelector(globalGetPendingSelector)
  const { uid, content } = useSelector(globalGetCurrentFileSelector)

  // file system handlers - context
  const [ffHandlers, setFFHandlers] = useState<{ [key: TUid]: FileSystemHandle }>({})
  const setFFHandler = (handlers: { uid: TUid, handler: FileSystemHandle }[]) => {
    let newHandlers: { [key: TUid]: FileSystemHandle } = {}
    handlers.map(({ uid, handler }) => {
      newHandlers[uid] = handler
    })
    setFFHandlers({ ...ffHandlers, ...newHandlers })
  }

  // file-content saving handler
  const handleSaveFFContent = async () => {
    // get the current file handler
    let handler = ffHandlers[uid]
    if (handler === undefined) {
      return
    }

    dispatch(setGlobalPending(true))

    /* for the remote rainbow */
    if (await verifyPermission(handler) === false) {
      console.log('show save file picker')
      handler = await showSaveFilePicker({ suggestedName: handler.name })
    }

    const writableStream = await (handler as FileSystemFileHandle).createWritable()
    await writableStream.write(content)
    await writableStream.close()

    dispatch(setGlobalPending(false))
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
        position: "relative",
      }}>

        <HmsModule />

        {/* Save btn */}
        <button
          style={{
            position: "absolute",
            zIndex: "1",
            top: "0px",
            right: "1rem",
            background: "rgb(23 111 44)",
            color: "white",
            border: "none",
            font: "normal lighter normal 12px Arial",
          }}
          onClick={handleSaveFFContent}
        > Save </button>

        <ActionsPanel />
        <StageView />
        <CodeView />
      </div>
    </MainContext.Provider>
  </>)
}