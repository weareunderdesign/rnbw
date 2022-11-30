import React, {
  useMemo,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { TreeView } from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  addNode,
  duplicateNode,
  generateNodeUid,
  moveNode,
  parseFile,
  removeNode,
  replaceNode,
  serializeFile,
  validateUids,
} from '@_node/index';
import {
  TNode,
  TTree,
  TUid,
} from '@_node/types';
import * as Main from '@_redux/main';

import { renderers } from './renderers';
import { NodeTreeViewProps } from './types';

export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const { type, content } = useSelector(Main.globalGetCurrentFileSelector)

  // fetch fn state
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const expandedItems = useSelector(Main.fnGetExpandedItemsSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)

  // node tree view data state
  const [treeData, setTreeData] = useState<TTree>({})
  const nodeTreeViewData = useMemo(() => {
    const _treeData: TTree = parseFile({ type, content })
    setTreeData(_treeData)

    let data: TreeViewData = {}
    for (const uid in _treeData) {
      data[uid] = {
        index: _treeData[uid].uid,
        data: _treeData[uid],
        children: _treeData[uid].children,
        hasChildren: !_treeData[uid].isEntity,
        canMove: true,
        canRename: true,
      }
    }

    return data
  }, [content])

  /* update the global state */
  const updateFFContent = async (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(Main.updateFileContent(content))
  }

  /* add/remove/duplicate handlers */
  const handleAddFNNode = (nodeType: string) => {
    /* check focusedItem is valid */
    const focusedNode = treeData[focusedItem]
    if (focusedNode === undefined || focusedNode.isEntity) {
      return
    }

    const tree = JSON.parse(JSON.stringify(treeData))
    const p_uid: TUid = focusedItem
    let newNode: TNode = {
      uid: generateNodeUid(p_uid, treeData[p_uid].children.length + 1),
      p_uid: p_uid,
      name: nodeType,
      isEntity: false,
      children: [],
      data: {},
    }
    const res = addNode({ tree, targetUid: p_uid, node: newNode })
    if (res.success === true) {
      updateFFContent(tree)
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }
  }
  const handleRemoveFnNode = () => {
    /* validate the selected items */
    const uids = validateUids(selectedItems)
    if (uids.length === 0) return

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = removeNode({ tree, nodeUids: uids })
    if (res.success === true) {
      updateFFContent(tree)
      dispatch(Main.updateFNNode({ deletedUids: res.deletedUids, convertedUids: res.convertedUids }))
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }
  }
  const handleDuplicateFNNode = () => {
    /* check if it's root */
    if (focusedItem === 'root') {
      return
    }

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = duplicateNode({ tree, node: { ...tree[focusedItem] } })
    if (res.success === true) {
      updateFFContent(tree)
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }
  }

  // cb
  const cb_focusNode = (uid: TUid) => {
    dispatch(Main.focusFNNode(uid))
  }
  const cb_selectNode = (uids: TUid[]) => {
    dispatch(Main.selectFNNode(uids))
  }
  const cb_expandNode = (uid: TUid) => {
    dispatch(Main.expandFNNode([uid]))
  }
  const cb_collapseNode = (uid: TUid) => {
    dispatch(Main.collapseFNNode([uid]))
  }
  const cb_renameNode = (uid: TUid, name: string) => {
    const tree = JSON.parse(JSON.stringify(treeData))
    const node = { ...tree[uid], name }
    const res = replaceNode({ tree, node })
    if (res.success === true) {
      updateFFContent(tree)
    }
    else {
      // dispatch(Main.setGlobalError(res.error as string))
    }
  }
  const cb_dropNode = (payload: { [key: string]: any }) => {
    // validate dnd uids
    let validatedUids: TUid[] = []
    validatedUids = validateUids(payload.uids, payload.parentUid)
    if (validatedUids.length == 0) {
      return
    }

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = moveNode({
      tree,
      isBetween: payload.isBetween,
      parentUid: payload.parentUid,
      position: payload.position,
      uids: payload.uids
    })
    if (res.success === true) {
      dispatch(Main.updateFNNode({ convertedUids: res.convertedUids }))
      updateFFContent(tree)
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }
  }

  return (<>
    <div
      style={{
        width: "100%",
        height: "300px",
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

        {/* Nav Bar */}
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
          {/* Create DIV node Button */}
          <button
            style={{
              zIndex: "2",
              margin: "0 5px",
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={() => handleAddFNNode('div')}
          >
            Add Div
          </button>

          {/* Duplicate Node Button */}
          <button
            style={{
              zIndex: "2",
              margin: "0 5px",
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={handleDuplicateFNNode}
          >
            Duplicate
          </button>

          {/* Delete Node Button */}
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
            Delete
          </button>
        </div>
      </div>

      {/* Main TreeView */}
      <TreeView
        /* style */
        width={'300px'}
        height={'400px'}

        /* data */
        data={nodeTreeViewData}
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
          canReorderItems: true,
        }}

        /* cb */
        callbacks={{
          /* RENAME CALLBACK */
          onRenameItem: (item, name, treeId) => {
            cb_renameNode(item.index as TUid, name)
          },

          /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
          onSelectItems: (items, treeId) => {
            cb_selectNode(items as TUid[])
          },
          onFocusItem: (item, treeId) => {
            cb_focusNode(item.index as TUid)
          },
          onExpandItem: (item, treeId) => {
            cb_expandNode(item.index as TUid)
          },
          onCollapseItem: (item, treeId) => {
            cb_collapseNode(item.index as TUid)
          },

          // DnD CALLBACK
          onDrop: (items, target) => {
            // building drop-node-payload
            const uids: TUid[] = items.map(item => item.index as TUid)
            const isBetween = target.targetType === 'between-items'
            const parentUid = isBetween ? target.parentItem : target.targetItem
            const position = isBetween ? target.childIndex : 0
            cb_dropNode({ uids: uids, isBetween, parentUid, position })
          }
        }}
      />
    </div>
  </>)
}