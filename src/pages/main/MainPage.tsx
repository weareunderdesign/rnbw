import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { Editor, EditorState, QueryMethods } from '@craftjs/core';

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
import { TTree, TUid } from '@_node/types';
import {
  FFHandlers,
  globalGetCurrentFileSelector,
  globalGetErrorSelector,
  globalGetNodeTreeSelector,
  globalGetPendingSelector,
  MainContext,
  setGlobalPending,
  updateFileContent,
} from '@_redux/main';
import { verifyPermission } from '@_services/main';

import { MainPageProps } from './types';
import { Container, Text, Button } from '@_components/main/stageView/components/selectors';
import { Node } from '@craftjs/core';
import { QueryCallbacksFor } from '@craftjs/utils';
import { moveNode, serializeFile, updateNode } from '@_node/apis';

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
  const { uid, content, type } = useSelector(globalGetCurrentFileSelector)

  // toast for global errors
  const [toastOpen, setToastOpen] = useState(false)
  useEffect(() => {
    setToastOpen(true)
  }, [error])

  const nodetree = useSelector(globalGetNodeTreeSelector)

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

  const onBeforeMoveEnd = (targetNode: Node, newParentNode: Node, existingParentNode: Node) => {
    console.log(targetNode.id, newParentNode.id, existingParentNode.id)
    newParentNode.data.nodes.map((node) => console.log(node))    // console.log(targetNode, newParentNode)
  };

  const onNodesChange = (query: QueryCallbacksFor<typeof QueryMethods>) => {
    const state: EditorState = query.getState();
    if (state.events.selected.size == 0)
      return;
    let selectedNode: string = "";
    state.events.selected.forEach((key) => {
      selectedNode = key;
    });
    
    const tree = JSON.parse(JSON.stringify(nodetree))
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
        uids: [selectedNode]
      }
      const result = moveNode(movePayload)
      if (result.success == true){
        updateFFContent(tree)
      } else{
      }
    }
  
  }

  /* update the global state */
  const updateFFContent = async (tree: TTree) => {
    console.log("update content")
    const content = serializeFile({ type, tree })
    dispatch(updateFileContent(content))
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
          onBeforeMoveEnd={onBeforeMoveEnd}
          onNodesChange={onNodesChange}
        >
          <ActionsPanel />
          <StageView />
          <CodeView />
        </Editor>

      </div>
    </MainContext.Provider>
  </>)
}