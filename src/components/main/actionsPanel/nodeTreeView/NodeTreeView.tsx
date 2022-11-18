import React, {
  useMemo,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  globalGetCurrentFileSelector,
  globalGetWorkspaceSelector,
  setGlobalError,
} from '@_redux/global';
import { collapseFNNode, expandFNNode, fnGetExpandedItemsSelector, fnGetFocusedItemSelector, fnGetSelectedItemsSelector, focusFNNode, selectFNNode } from '@_redux/fn';
import { TNode, TTree, TUid } from '@_node/types';
import { addNode, moveNode, parseFile, removeNode, replaceNode, serializeFile } from '@_node/index';
import { TreeViewData } from '@_components/common/treeView/types';
import { socketSendMessage } from '@_redux/socket';
import { generateNodeUID } from '@_types/global';
import { TreeView } from '@_components/common';
import { renderers } from './renderers';

export default function NodeTreeView() {
  const dispatch = useDispatch()

  // fetch global state
  const { uid: fuid, type, content } = useSelector(globalGetCurrentFileSelector)
  const workspace = useSelector(globalGetWorkspaceSelector)

  // fetch ff state
  const focusedItem = useSelector(fnGetFocusedItemSelector)
  const expandedItems = useSelector(fnGetExpandedItemsSelector)
  const selectedItems = useSelector(fnGetSelectedItemsSelector)

  const [treeData, setTreeData] = useState<TTree>({})

  // node tree view data state
  const nodeTreeViewData = useMemo(() => {
    console.log(type, content)
    const treedata: TTree = parseFile({ type, content })
    setTreeData(treedata)
    console.log(treedata)
    let data: TreeViewData = {}
    for (const uid in treedata) {
      data[uid] = {
        index: treedata[uid].uid,
        data: treedata[uid],
        children: treedata[uid].children,
        hasChildren: treedata[uid].isEntity,
        canMove: true,
        canRename: true,
      }
    }
    return data
  }, [content])

  const updateFFContent = (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'update',
        payload: {
          file: workspace[fuid],
          content: content,
        },
      },
    }))
  }

  const handleAddFNNode = () => {
    let PID: string;
    if (selectedItems.length == 0) {
      PID = "root"
    } else {
      PID = selectedItems[0];
    }
    let newNode: TNode = {
      uid: generateNodeUID(PID, treeData[PID].children.length + 1),
      name: 'div',
      p_uid: PID,
      isEntity: true,
      children: [],
      data: undefined
    };
    const result = addNode({ tree: treeData, targetUid: PID, node: newNode })
    if (result.success == true)
      updateFFContent(treeData)
    else {
      dispatch(setGlobalError(result.error as string))
    }
  }

  const handleRemoveFnNode = () => {
    if (selectedItems.length == 0)
      return;
    const result = removeNode({ tree: treeData, nodeUids: selectedItems })
    if (result.success == true)
      updateFFContent(treeData)
    else {
      dispatch(setGlobalError(result.error as string))
    }
  }

  // cb
  const cb_focusNode = (uid: TUid) => {
    dispatch(focusFNNode(uid))
  }
  const cb_expandNode = (uid: TUid) => {
    dispatch(expandFNNode(uid))
  }
  const cb_collapseNode = (uid: TUid) => {
    dispatch(collapseFNNode(uid))
  }
  const cb_selectNode = (uids: TUid[]) => {
    dispatch(selectFNNode(uids))
  }

  const cb_readNode = (uid: TUid) => {
  }

  const cb_renameNode = (uid: TUid, name: string) => {
    // call API
    let node = treeData[uid]
    node.name = name
    const result = replaceNode({ tree: treeData, node: node })
    if (result.success == true)
      updateFFContent(treeData)
    else
      dispatch(setGlobalError(result.error as string))
  }

  return (<>
    <div
      style={{
        width: "100%",
        height: "400px",
        overflow: "auto",
        borderBottom: "1px solid rgb(10, 10, 10)",
      }}
    >
      {/* Name Bar */}
      <div
        style={{
          zIndex: "1",
          position: "sticky",
          top: "0",
          width: "100%",
          color: "white",
          fontSize: "13px",
          padding: "2px 0px 5px 5px",
          marginBottom: "5px",
          borderBottom: "1px solid black",
          background: "rgb(31, 36, 40)"
        }}
      >
        Node


        <div
          style={{
            zIndex: "2",
            position: "absolute",
            top: "0px",
            right: "0px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: "flex-end",
            width: "100%",
            height: '100%',
          }}
        >
          {/* Create Node Button */}
          <button
            style={{
              zIndex: "2",
              margin: "0 5px",
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={handleAddFNNode}
          >
            +
          </button>
          <button
            style={{
              zIndex: "2",
              top: "3px",
              right: "28px",
              background: "rgb(193 22 22)",
              color: "white",
              border: "none",
              margin: "0 5px",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={handleRemoveFnNode}
          >
            x
          </button>
        </div>
      </div>

      {/* Main TreeView */}
      <TreeView
        width={'300px'}
        height={'400px'}
        data={nodeTreeViewData}

        renderers={renderers}

        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        cb_focusNode={cb_focusNode}
        cb_expandNode={cb_expandNode}
        cb_collapseNode={cb_collapseNode}
        cb_selectNode={cb_selectNode}

        cb_readNode={cb_readNode}
        cb_renameNode={cb_renameNode}
        cb_dropNode={(uids: TUid[], targetUID: string) => {
          if (treeData[uids[0]].p_uid == targetUID)
            return;
          const result = moveNode({
            tree: treeData,
            isBetween: false,
            parentUid: targetUID,
            uids: uids
          })
          if (result.success == true)
            updateFFContent(treeData)
          else
            dispatch(setGlobalError(result.error as string))
        }}
      />
    </div>
  </>)
}