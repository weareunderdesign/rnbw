import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { ActionCreators } from 'redux-undo';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';
import {
  Button,
  Container,
  Text,
} from '@_components/main/stageView/components/selectors';
import { TUid } from '@_node/types';
import * as Main from '@_redux/main';
import { verifyPermission } from '@_services/main';
import { Editor } from '@craftjs/core';

import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // file system handlers - context
  const [ffHandlers, setFFHandlers] = useState<Main.FFHandlers>({})
  const _setFFHandlers = useCallback((deletedUids: TUid[], handlers: { [uid: TUid]: FileSystemHandle }) => {
    const uidObj: { [uid: TUid]: boolean } = {}
    deletedUids.map(uid => uidObj[uid] = true)

    let newHandlers: Main.FFHandlers = {}
    for (const uid in ffHandlers) {
      if (uidObj[uid] === undefined) {
        newHandlers[uid] = ffHandlers[uid]
      }
    }
    setFFHandlers({ ...newHandlers, ...handlers })
  }, [ffHandlers])

  // fetch global state
  const pending = useSelector(Main.globalGetPendingSelector)
  const error = useSelector(Main.globalGetErrorSelector)
  const { uid, content } = useSelector(Main.globalGetCurrentFileSelector)

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

    dispatch(Main.setGlobalPending(true))

    /* for the remote rainbow */
    if (await verifyPermission(handler) === false) {
      console.log('show save file picker')
      handler = await showSaveFilePicker({ suggestedName: handler.name })
    }

    const writableStream = await (handler as FileSystemFileHandle).createWritable()
    await writableStream.write(content)
    await writableStream.close()

    dispatch(Main.setGlobalPending(false))
  }

  /* hms methods */
  const cmdz = () => {
    dispatch(ActionCreators.undo())
  }
  const cmdy = () => {
    dispatch(ActionCreators.redo())
  }

  /* toogle code  view */
  const [showCodeView, setShowCodeView] = useState(false)
  const toogleCodeView = () => {
    setShowCodeView(!showCodeView)
  }

  return (<>
    <div className="page">
      <div className="direction-row">
        <h1 className="center text-s"><span className="text-s opacity-m">Rainbow v1.0 /</span> Main Page</h1>
      </div>
      <div className="direction-column background-primary border shadow">
        {/* wrap with the context */}
        <Main.MainContext.Provider value={{ ffHandlers: ffHandlers, setFFHandlers: _setFFHandlers }}>
          {/* top bar */}
          <div className="direction-column padding-s box-l justify-stretch border-bottom">
            <div className="gap-s box justify-start">
              <span className="text-s opacity-m">Actions Panel / Stage View / Code View</span>
            </div>
            <div className="gap-m justify-end box">
              {/* hms actions */}
              <div className="icon-arrowleft opacity-m icon-s" onClick={cmdz}></div>
              <div className="icon-arrowright opacity-m icon-s" onClick={cmdy}></div>

              {/* toogle codeview */}
              <div className="icon-code opacity-m icon-s" onClick={toogleCodeView}></div>

              {/* file save */}
              <div className="icon-cloud opacity-m icon-s" onClick={handleSaveFFContent}></div>

              {/* avatar */}
              <div className="radius-m icon-s align-center background-secondary">
                <span className="text-s">V</span>
              </div>
            </div>
          </div>

          {/* spinner */}
          {pending &&
            <div style={{ zIndex: "9999", position: "fixed", top: "0", right: "0", bottom: "0", left: "0" }}>
            </div>
          }

          {/* wrap with the craft.js editor */}
          <Editor
            resolver={{
              Container,
              Text,
              Button,
            }}
          >
            <ActionsPanel />
            <StageView />
            {showCodeView && <CodeView />}
          </Editor>
        </Main.MainContext.Provider>
      </div>
    </div>
  </>)
}