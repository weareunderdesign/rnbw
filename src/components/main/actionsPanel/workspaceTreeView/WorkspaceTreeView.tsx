import React, { useMemo } from 'react';

import { TreeItem } from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { TreeView } from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import { TUid } from '@_node/types';
import {
  ffGetExpandedItemsSelector,
  ffGetFocusedItemSelector,
  ffGetSelectedItemsSelector,
  focusFFNode,
  selectFFNode,
} from '@_redux/ff';
import { globalGetWorkspaceSelector } from '@_redux/global';
import { socketSendMessage } from '@_redux/socket';
import {
  FFNode,
  FFNodeActionAddPayload,
  FFNodeActionClosePayload,
  FFNodeActionOpenPayload,
  FFNodeActionReadPayload,
  FFNodeActionRemovePayload,
  FFNodeActionRenamePayload,
} from '@_types/ff';

import { renderers } from './renderers';
import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const workspace = useSelector(globalGetWorkspaceSelector)

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

    // push all of the ffnodes in workspace from the global state
    for (const uid in workspace) {
      const node: FFNode = workspace[uid]
      if (node.p_uid === null) {
        rootNode.children?.push(node.uid)
        rootNode.hasChildren = true

        data[uid] = {
          index: uid,
          data: node,
          children: node.children,
          hasChildren: !node.isEntity,
          canMove: false,
          canRename: true,
        }
      } else {
        data[uid] = {
          index: uid,
          data: node,
          children: node.children,
          hasChildren: !node.isEntity,
          canMove: true,
          canRename: true,
        }
      }
    }

    // return final object data
    const treeViewData = {
      root: rootNode,
      ...data
    }
    return treeViewData
  }, [workspace])

  // import project folder to workspace
  const onAddBtnClick = () => {
    // call add api
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'add',
        payload: {} as FFNodeActionAddPayload,
      },
    }))
  }
  // remove project folder from workspace
  const onRemoveBtnClick = () => {
    // return if it's not the project folder
    if (workspace[focusedItem].p_uid !== null) {
      return
    }
    // call remove api
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'remove',
        payload: getSubDirectoryUids(focusedItem) as FFNodeActionRemovePayload,
      },
    }))
  }

  // get all of the nested chidren uids
  const getSubDirectoryUids = (uid: TUid): TUid[] => {
    let nodes: FFNode[] = [workspace[uid]]
    let uids: TUid[] = []
    while (nodes.length) {
      const node = nodes.shift() as FFNode
      uids.push(node.uid)
      for (const childUid of node.children) {
        if (!workspace[childUid].isEntity) {
          nodes.push(workspace[childUid])
        }
      }
    }
    return uids
  }
  // get all of the nested chidren nodes
  const getSubDirectoryNodes = (uid: TUid): FFNode[] => {
    let nodes: FFNode[] = []
    let uids: TUid[] = [uid]
    while (uids.length) {
      const uid = uids.shift() as TUid
      const node = workspace[uid]
      nodes.push(node)
      for (const childUid of node.children) {
        uids.push(childUid)
      }
    }
    return nodes
  }

  // cb
  const cb_focusFFNode = (uid: TUid) => {
    dispatch(focusFFNode(uid))
  }
  const cb_selectFFNode = (uids: TUid[]) => {
    dispatch(selectFFNode(uids))
  }
  const cb_expandFFNode = (uid: TUid) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'open',
        payload: workspace[uid] as FFNodeActionOpenPayload,
      },
    }))
  }
  const cb_collapseFFNode = (uid: TUid) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'close',
        payload: getSubDirectoryUids(uid) as FFNodeActionClosePayload,
      },
    }))
  }
  const cb_readFFNode = (uid: TUid) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'read',
        payload: workspace[uid] as FFNodeActionReadPayload,
      },
    }))
  }
  const cb_renameFFNode = (uid: TUid, name: string) => {
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'rename',
        payload: {
          nodes: getSubDirectoryNodes(uid),
          name: name,
        } as FFNodeActionRenamePayload,
      },
    }))
  }

  // move/duplicate create/delete actions
  const cb_dropFFNode = (uids: TUid[], targetUID: TUid) => {
    /* const ffNodes: FFNode[] = []
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
    })) */
  }
  const createFFNode = () => {
    /* if (projects[focusedItem] && projects[focusedItem].type === 'file') {
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
    })) */
  }
  const deleteFFNode = () => {
    /* console.log('delete FFNode', selectedItems)
    const ffNodes: FFNode[] = []
    for (const uid of selectedItems) {
      ffNodes.push(workspace[uid] || projects[uid])
    }
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'delete',
        payload: ffNodes,
      },
    })) */
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
            disabled={true}
          >
            Create
          </button>

          {/* Delete Node Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={deleteFFNode}
            disabled={true}
          >
            Delete
          </button>

          {/* Add Project Button */}
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

          {/* Remove Project Button */}
          <button
            style={{
              background: "red",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={onRemoveBtnClick}
          >
            Close
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