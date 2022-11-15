import React, { useMemo } from 'react';

import { TreeItem } from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { TreeView } from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  ffGetExpandedItemsSelector,
  ffGetFocusedItemSelector,
  ffGetSelectedItemsSelector,
  focusFFNode,
  selectFFNode,
} from '@_redux/ff';
import {
  globalGetProjectsSelector,
  globalGetWorkspaceSelector,
} from '@_redux/global';
import { socketSendMessage } from '@_redux/socket';
import {
  FFNodeActionAddPayload,
  FFNodeActionClosePayload,
  FFNodeActionMovePayload,
  FFNodeActionOpenPayload,
  FFNodeActionReadPayload,
  FFNodeActionRenamePayload,
  FFObject,
} from '@_types/ff';
import {
  NAME,
  UID,
} from '@_types/global';

import { renderers } from './renderers';

export default function WorkspaceTreeView() {
  const dispatch = useDispatch()

  // fetch global state
  const workspace = useSelector(globalGetWorkspaceSelector)
  const projects = useSelector(globalGetProjectsSelector)

  // fetch ff state
  const focusedItem = useSelector(ffGetFocusedItemSelector)
  const expandedItems = useSelector(ffGetExpandedItemsSelector)
  const selectedItems = useSelector(ffGetSelectedItemsSelector)

  // workspace tree view data state
  const workspaceTreeViewData = useMemo(() => {
    let data: TreeViewData = {}

    // build the workspace main root ff node
    let rootNode: TreeItem = {
      index: 'root',
      data: 'root',
      children: [],
      hasChildren: false,
      canMove: false,
      canRename: false,
    }

    // push all of the ffnodes inside the workspace and the projects from the global state
    for (const uid in workspace) {
      const ffNode: FFObject = workspace[uid]
      rootNode.children?.push(ffNode.uid)
      rootNode.hasChildren = true

      data[uid] = {
        index: uid,
        data: ffNode,
        children: ffNode.children || [],
        hasChildren: ffNode.type === 'folder' ? true : false,
        canMove: true,
        canRename: true,
      }
    }
    for (const uid in projects) {
      const ffNode: FFObject = projects[uid]

      data[uid] = {
        index: uid,
        data: ffNode,
        children: ffNode.children || [],
        hasChildren: ffNode.type === 'folder' ? true : false,
        canMove: true,
        canRename: true,
      }
    }

    // return final object data
    const treeViewData = {
      root: rootNode,
      ...data
    }
    return treeViewData
  }, [workspace, projects])

  const onAddBtnClick = () => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'add',
        payload: {} as FFNodeActionAddPayload,
      },
    }))
  }

  // cb
  const cb_focusFFNode = (uid: UID) => {
    dispatch(focusFFNode(uid))
  }
  const cb_selectFFNode = (uids: UID[]) => {
    dispatch(selectFFNode(uids))
  }

  const cb_expandFFNode = (uid: UID) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'open',
        payload: (workspace[uid] || projects[uid]) as FFNodeActionOpenPayload,
      },
    }))
  }
  const cb_collapseFFNode = (uid: UID) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'close',
        payload: (workspace[uid] || projects[uid]) as FFNodeActionClosePayload,
      },
    }))
  }

  const cb_readFFNode = (uid: UID) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'read',
        payload: projects[uid] as FFNodeActionReadPayload,
      },
    }))
  }
  const cb_renameFFNode = (uid: UID, name: NAME) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'rename',
        payload: {
          ffNode: workspace[uid] || projects[uid],
          name: name,
        } as FFNodeActionRenamePayload,
      },
    }))
  }

  const cb_dropFFNode = (uids: UID[], targetUID: UID) => {
    const ffNodes: FFObject[] = []
    for (const uid of uids) {
      ffNodes.push(workspace[uid] || projects[uid])
    }
    const target = workspace[targetUID] || projects[targetUID]
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'move',
        payload: {
          ffNodes: ffNodes,
          target: target,
          overwrite: true,
        } as FFNodeActionMovePayload,
      },
    }))
  }

  // create/delete actions
  const createFFNode = () => {
    if (projects[focusedItem] && projects[focusedItem].type === 'file') {
      return
    }
    const targetFFNode = workspace[focusedItem] || projects[focusedItem]
    console.log('create FFNode', targetFFNode)

    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'create',
        payload: {
          target: targetFFNode,
          type: 'file',
        },
      },
    }))
  }
  const deleteFFNode = () => {
    console.log('delete FFNode', selectedItems)
    const ffNodes: FFObject[] = []
    for (const uid of selectedItems) {
      ffNodes.push(workspace[uid] || projects[uid])
    }
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'delete',
        payload: ffNodes,
      },
    }))
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
          background: "rgb(31, 36, 40)",
        }}
      >
        Workspace

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
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={createFFNode}
          >
            +
          </button>

          {/* Create Node Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={deleteFFNode}
          >
            -
          </button>

          {/* Import Project Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={onAddBtnClick}
          >
            Open
          </button>
        </div>
      </div>

      {/* Main TreeView */}
      <TreeView
        width={'300px'}
        height={'400px'}
        data={workspaceTreeViewData}
        renderers={renderers}
        /* props={} */

        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        cb_focusNode={cb_focusFFNode}
        cb_selectNode={cb_selectFFNode}

        cb_expandNode={cb_expandFFNode}
        cb_collapseNode={cb_collapseFFNode}

        cb_readNode={cb_readFFNode}
        cb_renameNode={cb_renameFFNode}

        cb_dropNode={cb_dropFFNode}
      />
    </div>
  </>)
}

/* declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;        // remember to make these attributes optional....
    webkitdirectory?: string;
  }
} */