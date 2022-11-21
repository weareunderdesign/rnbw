import React, { useMemo } from 'react';

import {
  DraggingPositionItem,
  TreeItem,
} from 'react-complex-tree';
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
import { FFNode } from '@_types/ff';

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
  const onAddBtnClick = async () => {
    const currentDirHandle = await window.showDirectoryPicker();
    for await (const entry of currentDirHandle.values()) {
      console.log(entry)
    }
    const values = await currentDirHandle.values()
    console.log(currentDirHandle)
  }
  // remove project folder from workspace
  const onRemoveBtnClick = () => {
    // return if it's not the project folder
    if (workspace[focusedItem].p_uid !== null) {
      return
    }

  }

  // cb
  const cb_focusFFNode = (uid: TUid) => {
    dispatch(focusFFNode(uid))
  }
  const cb_selectFFNode = (uids: TUid[]) => {
    dispatch(selectFFNode(uids))
  }
  const cb_expandFFNode = (uid: TUid) => {

  }
  const cb_collapseFFNode = (uid: TUid) => {

  }
  const cb_readFFNode = (uid: TUid) => {

  }
  const cb_renameFFNode = (uid: TUid, name: string) => {

  }

  // move/duplicate create/delete actions
  const cb_dropFFNode = (uids: TUid[], targetUID: TUid) => {

  }
  const createFFNode = () => {

  }
  const deleteFFNode = () => {

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
        /* style */
        width={'300px'}
        height={'400px'}

        /* data */
        data={workspaceTreeViewData}
        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        /* renderers */
        renderers={renderers}

        /* possibilities */
        props={{
          canDragAndDrop: true,
          canDropOnItemWithChildren: true,
          canDropOnItemWithoutChildren: false,
        }}

        /* cb */
        callbacks={{
          /* RENAME CALLBACK */
          onRenameItem: (item, name, treeId) => {
            console.log('onRenameItem', item, name, treeId)
            cb_renameFFNode(item.index as TUid, name)
          },

          /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
          onSelectItems: (items, treeId) => {
            console.log('onSelectItems', items)
            cb_selectFFNode(items as TUid[])
          },
          onFocusItem: (item, treeId) => {
            console.log('onFocusItem', item.index)
            cb_focusFFNode(item.index as TUid)
          },
          onExpandItem: (item, treeId) => {
            console.log('onExpandItem', item.index)
            cb_expandFFNode(item.index as TUid)
          },
          onCollapseItem: (item, treeId) => {
            console.log('onCollapseItem', item.index)
            cb_collapseFFNode(item.index as TUid)
          },

          /* READ CALLBACK */
          onPrimaryAction: (item, treeId) => {
            console.log('onPrimaryAction', item.index, treeId)
            cb_readFFNode(item.index as TUid)
          },

          // DnD CALLBACK
          onDrop: (items, target) => {
            console.log('onDrop', items, target)
            const uids: TUid[] = []
            for (const item of items) {
              uids.push(item.index as string)
            }

            if (target.targetType === 'between-items') {
              /* target.parentItem
              target.childIndex
              target.linePosition */
            } else if (target.targetType === 'item') {
              /* target.targetItem */
            }

            const targetTUid: TUid = (target as DraggingPositionItem).targetItem as string
            console.log('onDrop', uids, targetTUid)
            cb_dropFFNode(uids, targetTUid)
          }
        }}
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

declare global {
  interface Window {
    showDirectoryPicker?: any;
  }
}