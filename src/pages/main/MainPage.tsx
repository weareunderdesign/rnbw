import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { Editor } from '@craftjs/core';

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
  FFHandlers,
  globalGetCurrentFileSelector,
  globalGetErrorSelector,
  globalGetPendingSelector,
  MainContext,
  setGlobalPending,
} from '@_redux/main';
import { verifyPermission } from '@_services/main';

import { MainPageProps } from './types';
import { Container, Text, Button } from '@_components/main/stageView/components/selectors';


export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // file system handlers - context
  const [ffHandlers, setFFHandlers] = useState<FFHandlers>({})
  const _setFFHandlers = useCallback((deletedUids: TUid[], handlers: { [uid: TUid]: FileSystemHandle }) => {
    const uidObj: { [uid: TUid]: boolean } = {}
    deletedUids.map(uid => uidObj[uid] = true)

    let newHandlers: FFHandlers = {}
    for (const uid in ffHandlers) {
      if (uidObj[uid] === undefined) {
        newHandlers[uid] = ffHandlers[uid]
      }
    }
    setFFHandlers({ ...newHandlers, ...handlers })
  }, [ffHandlers])

  // fetch global state
  const pending = useSelector(globalGetPendingSelector)
  const error = useSelector(globalGetErrorSelector)
  const { uid, content } = useSelector(globalGetCurrentFileSelector)

  // toast for global errors
  const [toastOpen, setToastOpen] = useState(false)
  useEffect(() => {
    setToastOpen(true)
  }, [error])


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
      <div style={{ zIndex: "9999", position: "fixed", top: "0", right: "0", bottom: "0", left: "0" }}>
      </div>
    }
    <MainContext.Provider value={{ ffHandlers: ffHandlers, setFFHandlers: _setFFHandlers }}>
      {/* history management system module */}
      <HmsModule />

      <div className='view box-l padding-xs foreground-primary' data-theme='light' style={{ height: "0px" }}>
        {/* <button className='' onClick={handleSaveFFContent}>
          Save
        </button> */}

        <Editor
          resolver={{
            Container,
            Text,
            Button,
          }}
        >
          <ActionsPanel />
          <StageView />
          <CodeView />
        </Editor>

      </div>
    </MainContext.Provider>
  </>)
}