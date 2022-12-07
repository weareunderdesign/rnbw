import React, {
  useCallback,
  useEffect,
  useMemo,
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
import NodeRenderer from '@_components/main/stageView/nodeRenderer';
import {
  moveNode,
  serializeFile,
} from '@_node/apis';
import {
  TTree,
  TUid,
} from '@_node/types';
import * as Main from '@_redux/main';
import {
  updateFileContent,
  updateFNTreeViewState,
} from '@_redux/main';
import {
  Editor,
  EditorState,
  Node,
  QueryMethods,
} from '@craftjs/core';
import { QueryCallbacksFor } from '@craftjs/utils';

import { MainPageProps } from './types';
import { Toast, CommandK } from '@_components/common';
import { CmdKItemGeneralProps } from '@_components/common/cmdk';
import { verifyPermission } from '@_services/main';

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

  const [command, setCommand] = useState<Main.Command>({ action: '', changed: false })

  // fetch global state
  const pending = useSelector(Main.globalGetPendingSelector)
  const { uid, content, type } = useSelector(Main.globalGetCurrentFileSelector)
  const _messages = useSelector(Main.globalGetMessagesSelector)
  const messages = useMemo(() => _messages, [_messages])

  const [cmdkOpen, setCmdkOpen] = useState(false)
  const nodeTree = useSelector(Main.globalGetNodeTreeSelector)

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

  // toogle code  view
  const [showCodeView, setShowCodeView] = useState(true)
  const toogleCodeView = async () => {
    setShowCodeView(!showCodeView)
  }

  /* update the currnet file content global state */
  const updateFFContent = async (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(updateFileContent(content))
  }

  const onBeforeMoveEnd = (targetNode: Node, newParentNode: Node, existingParentNode: Node) => {
  }

  const onNodesChange = (query: QueryCallbacksFor<typeof QueryMethods>) => {
    const state: EditorState = query.getState()
    if (state.events.selected.size == 0)
      return

    let selectedNodes: string[] = [];
    // get selected node ids
    state.events.selected.forEach((key) => {
      selectedNodes.push(key);
    });

    const tree = JSON.parse(JSON.stringify(nodeTree))

    if (state.events.dragged.size != 0) {
      // dragged and drop event
      console.log("drop action")
      const parentId = state.indicator.placement.parent.id
      const position = state.indicator.placement.index

      const movePayload = {
        tree: tree,
        isBetween: true,
        parentUid: parentId,
        position,
        uids: selectedNodes
      }
      const res = moveNode(movePayload)
      updateFFContent(tree)
      dispatch(Main.updateFNTreeViewState(res))
    }
  }

  const makeCmkItems = () => {
    const items: CmdKItemGeneralProps[] = []
    items.push({
      heading: 'Start',
      items: [
        { title: 'Open', shortcut: '⌘ 🄾', onSelect: () => { setCommand({ action: "OpenProject", changed: !command.changed }) } },
        { title: 'New File', shortcut: '⌘ 🄽', onSelect: () => { } },
      ]
    }, {
      heading: 'Action',
      items: [
        { title: 'Undo', shortcut: 'Ctrl Z', onSelect: () => { setCommand({ action: "cmdz", changed: !command.changed }) } },
        { title: 'Redo', shortcut: 'Ctrl Y', onSelect: () => { setCommand({ action: "cmdy", changed: !command.changed }) } }
      ]
    })
    return items
  }

  useEffect(() => {
    setCmdkOpen(false)
  }, [command.changed])

  useEffect(() => {
    switch (command.action) {
      case 'cmdz':
        cmdz()
        break
      case 'cmdy':
        cmdy()
        break
    }
  }, [command])

  const down = useCallback((e: KeyboardEvent) => {
    if (e.key === '\\' && e.metaKey) {
      e.preventDefault()
      setCmdkOpen(!cmdkOpen)
    }
    if (e.key === 'o' && e.ctrlKey) {
      e.preventDefault()
      setCommand({ action: "OpenProject", changed: !command.changed })
    }
    if (e.key === 'z' && e.ctrlKey) {
      setCommand({ action: "cmdz", changed: !command.changed })
    }
    if (e.key === 'y' && e.ctrlKey) {
      setCommand({ action: "cmdy", changed: !command.changed })
    }
  }, [cmdkOpen, command.changed])

  return (<>
    <Toast messages={messages} />
    <CommandK onKeyDownCallback={down} open={cmdkOpen} setOpen={setCmdkOpen} items={makeCmkItems()} />
    <div className="page">
      <div className="direction-row">
        <h1 className="center text-s"><span className="text-s opacity-m">Rainbow v1.0 /</span> Main Page</h1>
      </div>
      <div className="direction-column background-primary border shadow">
        {/* wrap with the context */}
        <Main.MainContext.Provider value={{ ffHandlers: ffHandlers, setFFHandlers: _setFFHandlers, command: command, setCommand: setCommand }}>
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
            </div >
          </div >

          {/* spinner */}
          {pending &&
            <div className='justify-center align-center background-secondary opacity-m' style={{ zIndex: "9999", position: "fixed", top: "0", right: "0", bottom: "0", left: "0" }}>
              <span className='text-s'>Pending...</span>
            </div>}

          {/* wrap with the craft.js editor */}
          <Editor
            resolver={{
              Container,
              Text,
              Button,
            }}
            onBeforeMoveEnd={onBeforeMoveEnd}
            onNodesChange={onNodesChange}
            onRender={NodeRenderer}
          >
            <ActionsPanel />
            <StageView />
            {showCodeView && <CodeView />}
          </Editor>
        </Main.MainContext.Provider >
      </div >
    </div >
  </>)
}