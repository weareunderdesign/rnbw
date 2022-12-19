import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { ActionCreators } from 'redux-undo';

import {
  CommandK,
  Toast,
} from '@_components/common';
import { CmdKItemGeneralProps } from '@_components/common/cmdk';
import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';
import NodeRenderer from '@_components/main/stageView/nodeRenderer';
import {
  Button,
  Container,
  Text,
} from '@_components/main/stageView/nodeRenderer/customRenderers';
import {
  moveNode,
  serializeFile,
} from '@_node/apis';
import {
  TTree,
  TUid,
} from '@_node/types';
import * as Main from '@_redux/main';
import { updateFileContent } from '@_redux/main';
import { verifyPermission } from '@_services/main';
import {
  Editor,
  EditorState,
  Node,
  QueryMethods,
} from '@craftjs/core';
import { QueryCallbacksFor } from '@craftjs/utils';

import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningAction = (actionNames: string[]) => {
    for (const actionName of actionNames) {
      runningActions.current[actionName] = true
    }
  }
  const removeRunningAction = (actionNames: string[], effect: boolean = true) => {
    for (const actionName of actionNames) {
      delete runningActions.current[actionName]
    }
    if (effect && noRunningAction()) {
      dispatch(Main.increaseActionGroupIndex())
    }
  }

  // ---------------- main context ----------------
  // file tree view
  const [ffHoveredItem, setFFHoveredItem] = useState<TUid>('')
  const _setFFHoveredItem = (uid: TUid) => setFFHoveredItem(uid)

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

  // node tree view
  const [fnHoveredItem, setFNHoveredItem] = useState<TUid>('')
  const _setFNHoveredItem = (uid: TUid) => setFNHoveredItem(uid)

  const [nodeTree, setNodeTree] = useState<TTree>({})
  const _setNodeTree = (tree: TTree) => setNodeTree(tree)

  const [validNodeTree, setValidNodeTree] = useState<TTree>({})
  const _setValidNodeTree = (tree: TTree) => setValidNodeTree(tree)

  // cmdk
  const [command, setCommand] = useState<Main.Command>({ action: '', changed: false })
  // ---------------- main context ----------------

  // redux state
  const { workspace, openedFiles, currentFile: { uid, content, type }, pending, messages } = useSelector(Main.globalSelector)

  // ---------------- cmdk ----------------
  // cmdk modal
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const makeCmkItems = useCallback(() => {
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
  }, [command.changed])

  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && e.ctrlKey) {
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

  // do actions
  useEffect(() => {
    // cmdk actions handle
    switch (command.action) {
      case 'cmdz':
        cmdz()
        break
      case 'cmdy':
        cmdy()
        break
      default:
        break
    }

    // close modal
    setCmdkOpen(false)
  }, [command.changed])

  // hms methods
  const cmdz = () => {
    dispatch(ActionCreators.undo())
  }
  const cmdy = () => {
    dispatch(ActionCreators.redo())
  }
  // ---------------- cmdk ----------------

  // toogle code view
  const [showCodeView, setShowCodeView] = useState(false)
  const toogleCodeView = async () => {
    setShowCodeView(!showCodeView)
  }

  // file-content saving handler
  const handleSaveFFContent = async () => {
    // get the current file handler
    let handler = ffHandlers[uid]
    if (handler === undefined) {
      return
    }

    dispatch(Main.setGlobalPending(true))

    // for the remote rainbow
    if (await verifyPermission(handler) === false) {
      console.log('show save file picker')
      handler = await showSaveFilePicker({ suggestedName: handler.name })
    }

    const writableStream = await (handler as FileSystemFileHandle).createWritable()
    await writableStream.write(content)
    await writableStream.close()

    dispatch(Main.setGlobalPending(false))
  }

  // update the currnet file content global state
  const updateFFContent = async (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(updateFileContent(content))
  }

  // ---------------- stage view ----------------
  const onBeforeMoveEnd = (targetNode: Node, newParentNode: Node, existingParentNode: Node) => {
    console.log('onBeforeMoveEnd', targetNode, newParentNode, existingParentNode)
  }

  // StageView DnD
  const onNodesChange = useCallback((query: QueryCallbacksFor<typeof QueryMethods>) => {
    console.log('onNodesChange')

    // get editor state
    const state: EditorState = query.getState()
    let selectedNodeUids: TUid[] = []
    state.events.selected.forEach((uid) => {
      selectedNodeUids.push(uid)
    })
    let draggedNodeUids: TUid[] = []
    state.events.dragged.forEach((uid) => {
      draggedNodeUids.push(uid)
    })

    if (selectedNodeUids.length === 0) return

    if (draggedNodeUids.length !== 0) {
      const tree = JSON.parse(JSON.stringify(nodeTree))

      // dragged and drop event
      const parentId = state.indicator.placement.parent.id
      const position = state.indicator.placement.index

      addRunningAction(['moveFNNode'])

      const movePayload = {
        tree: tree,
        isBetween: true,
        parentUid: parentId,
        position,
        uids: selectedNodeUids
      }

      const res = moveNode(movePayload)
      updateFFContent(res.tree)
      dispatch(Main.updateFNTreeViewState(res))

      removeRunningAction(['moveFNNode'])
    }
  }, [nodeTree])
  // ---------------- stage view ----------------

  return (<>
    {/* toast */}
    <Toast messages={messages} />

    {/* cmdk */}
    <CommandK
      open={cmdkOpen}
      setOpen={setCmdkOpen}
      items={makeCmkItems()}
      onKeyDownCallback={cb_onKeyDown}
    />

    <div className="page" style={{ maxWidth: '100vw' }}>
      <div className="direction-column background-primary border shadow">
        {/* wrap with the context */}
        <Main.MainContext.Provider
          value={{
            // file tree view
            ffHoveredItem,
            setFFHoveredItem: _setFFHoveredItem,

            ffHandlers,
            setFFHandlers: _setFFHandlers,

            // node tree view
            fnHoveredItem,
            setFNHoveredItem: _setFNHoveredItem,

            nodeTree,
            setNodeTree: _setNodeTree,

            validNodeTree,
            setValidNodeTree: _setValidNodeTree,

            // cmdk
            command,
            setCommand: setCommand,
          }}
        >
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
            <div
              className='justify-center align-center background-secondary opacity-m'
              style={{ zIndex: "9999", position: "fixed", top: "0", right: "0", bottom: "0", left: "0" }}
            >
              <span className='text-s'>Pending...</span>
            </div>}

          {/* wrap with the craft.js editor */}
          <Editor
            resolver={{
              Container,
              Text,
              Button,
            }}
            onRender={NodeRenderer}
            onBeforeMoveEnd={onBeforeMoveEnd}
            onNodesChange={onNodesChange}
          >
            <ActionsPanel />
            {true && <StageView />}
            {showCodeView && <CodeView />}
          </Editor>
        </Main.MainContext.Provider >
      </div >
    </div >
  </>)
}