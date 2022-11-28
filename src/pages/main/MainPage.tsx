import React, {
  useEffect,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { Toast } from '@_components/common';
import {
  ActionsPanel,
  CodeView,
  HmsModule,
  StageView,
} from '@_components/main';
import { TUid } from '@_node/types';
import {
  globalGetCurrentFileSelector,
  globalGetErrorSelector,
  globalGetPendingSelector,
  setGlobalPending,
} from '@_redux/global';
import { verifyPermission } from '@_services/global';
import { FFHandlers } from '@_types/ff';
import { Spinner } from '@blueprintjs/core';

import { FFContext } from '../../_redux/ff/context';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // fetch global state
  const pending = useSelector(globalGetPendingSelector)
  const error = useSelector(globalGetErrorSelector)
  const { uid, content } = useSelector(globalGetCurrentFileSelector)

  /* toast for global errors */
  const [toastOpen, setToastOpen] = useState(false)
  useEffect(() => {
    setToastOpen(true)
  }, [error])

  // file system handlers - context
  const [ffHandlers, setFFHandlers] = useState<FFHandlers>({})
  const _setFFHandlers = (handlers: { [uid: TUid]: FileSystemHandle }) => {
    setFFHandlers({ ...ffHandlers, ...handlers })
  }
  const _unsetFFHandlers = (uids: TUid[]) => {
    const uidObj: { [uid: TUid]: boolean } = {}
    uids.map(uid => uidObj[uid] = true)

    let newHandlers: FFHandlers = {}
    for (const uid in ffHandlers) {
      if (uidObj[uid] === undefined) {
        newHandlers[uid] = ffHandlers[uid]
      }
    }
    setFFHandlers(newHandlers)
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

    <Toast open={false} />

    <FFContext.Provider value={{ ffHandlers: ffHandlers, setFFHandlers: _setFFHandlers, unsetFFHandlers: _unsetFFHandlers }}>
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
        >
          Save
        </button>

        <ActionsPanel />
        <StageView />
        <CodeView />
      </div>
    </FFContext.Provider>
  </>)
}

/* class XSearch extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement('span');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);

    const name = this.getAttribute('name');
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(name);
    const root = ReactDOM.createRoot(mountPoint);
    root.render(<a href={url}>{name}</a>);
  }
}
customElements.define('x-search', XSearch);

class HelloMessage extends React.Component {
  render() {
    return <div>Hello <x-search>{this.props.name}</x-search>!</div>;
  }
} */