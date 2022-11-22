import React, {
  useContext,
  useMemo,
} from 'react';

import { showDirectoryPicker } from 'file-system-access';
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
import {
  generateNodeUid,
  getSubNEUids,
} from '@_node/apis';
import {
  TFileType,
  TNode,
  TUid,
} from '@_node/types';
import { MainContext } from '@_pages/main/context';
import {
  collapseFFNode,
  expandFFNode,
  ffGetExpandedItemsSelector,
  ffGetFocusedItemSelector,
  ffGetSelectedItemsSelector,
  focusFFNode,
  selectFFNode,
} from '@_redux/ff';
import {
  addFFNode,
  closeFFNode,
  globalGetPendingSelector,
  globalGetWorkspaceSelector,
  setCurrentFile,
  setGlobalPending,
} from '@_redux/global';
import { verifyPermission } from '@_services/global';
import { FFNode } from '@_types/ff';

import { renderers } from './renderers';
import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const workspace = useSelector(globalGetWorkspaceSelector)
  const pending = useSelector(globalGetPendingSelector)

  // fetch ff state
  const focusedItem = useSelector(ffGetFocusedItemSelector)
  const expandedItems = useSelector(ffGetExpandedItemsSelector)
  const selectedItems = useSelector(ffGetSelectedItemsSelector)

  const { handlers, setHandler } = useContext(MainContext)

  // workspace tree view data state
  const workspaceTreeViewData = useMemo(() => {
    // build the workspace main root ff node
    let rootNode: TreeItem = {
      index: 'root',
      data: 'root',
      children: [],
      hasChildren: false,
      canMove: false,
      canRename: false,
    }

    let data: TreeViewData = {}
    // push all of the ff nodes in workspace from the global state
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
    return {
      root: rootNode,
      ...data
    }
  }, [workspace])


  // import project folder to workspace
  const onAddBtnClick = async () => {
    
    const projectHandle = await showDirectoryPicker()
    // get the project count in the workspace
    dispatch(setGlobalPending(true))
    let projectCount = 0
    for (const uid in workspace) {
      const node = workspace[uid]
      projectCount += (node.p_uid === null ? 1 : 0)
    }

    let nodes: FFNode[] = []
    // add project node
    let projectUid = generateNodeUid("", projectCount)
    let handlers = []
    handlers.push({ uid: projectUid, handler: projectHandle })

    const projectNode: FFNode = {
      uid: projectUid,
      p_uid: null,
      name: projectHandle.name,
      isEntity: false,
      children: [],
      data: projectHandle.name,
    }


    // add children nodes
    let nodeIndex: number = 0
    for await (const entry of projectHandle.values()) {
      const nodeUid = generateNodeUid(projectUid, nodeIndex++)
      handlers.push({ uid: nodeUid, handler: entry })
      nodes.push({
        uid: nodeUid,
        p_uid: projectUid,
        name: entry.name,
        isEntity: entry.kind !== "directory",
        children: [],
        data: entry.name,
      })
    }
    nodes = nodes.sort((a: TNode, b: TNode) => {
      return Number(a.isEntity) < Number(b.isEntity) ? -1 :
        Number(a.isEntity) > Number(b.isEntity) ? 1 :
          a.name.toLowerCase() < b.name.toLowerCase() ? -1 :
            a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
    })
    nodes.map((node) => {
      projectNode.children.push(node.uid)
    })
    nodes.push(projectNode)
    setHandler(handlers)
    dispatch(addFFNode(nodes))
    dispatch(expandFFNode([projectUid]))
    dispatch(setGlobalPending(false))
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
    const uid = uids[0];
    const handler = handlers[uid]

    if (handler === undefined || handler.kind == "directory" || !verifyPermission(handler)) {
      return;
    }

    console.log(handler);

    (handler as FileSystemFileHandle).getFile().then(async (fileEntry) => {
      let content = await fileEntry.text();
      dispatch(setCurrentFile({
        uid,
        content,
        type: handler.name.split('.').pop() as TFileType
      }))
      dispatch(selectFFNode(uids))
    })
  }
  const cb_expandFFNode = async (uid: TUid) => {
    const parentNode: FFNode = JSON.parse(JSON.stringify(workspace[uid]))
    const cb = async (handler: FileSystemDirectoryHandle) => {
      if (!verifyPermission(handler))
        return
      let nodes: FFNode[] = []
      let p_uid: TUid = uid
      let nodeIndex: number = 1
      let handlers = []
      for await (const entry of handler.values()) {
        const nodeUid = generateNodeUid(p_uid, nodeIndex++)
        handlers.push({ uid: nodeUid, handler: entry })
        nodes.push({
          uid: nodeUid,
          p_uid: p_uid,
          name: entry.name,
          isEntity: entry.kind !== "directory",
          children: [],
          data: entry.name,
        })
      }
      nodes = nodes.sort((a: TNode, b: TNode) => {
        return Number(a.isEntity) < Number(b.isEntity) ? -1 :
          Number(a.isEntity) > Number(b.isEntity) ? 1 :
            a.name.toLowerCase() < b.name.toLowerCase() ? -1 :
              a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
      })
      nodes.map((node) => {
        parentNode.children.push(node.uid)
      })
      nodes.push(parentNode)
      setHandler(handlers)
      dispatch(addFFNode(nodes))
      dispatch(expandFFNode([uid]))
    }
    handlers ? cb(handlers[uid] as FileSystemDirectoryHandle) : null
  }
  const cb_collapseFFNode = (uid: TUid) => {
    dispatch(closeFFNode(getSubNEUids(uid, workspace)))
    dispatch(collapseFFNode([uid]))
  }
  const cb_readFFNode = (uid: TUid) => {

  }
  const cb_renameFFNode = (uid: TUid, name: string) => {

  }

  // move/duplicate create/delete actions
  const cb_dropFFNode = (uids: TUid[], targetUid: TUid) => {

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
