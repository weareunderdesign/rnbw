import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { TreeView } from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  addNode,
  duplicateNode,
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
import { OpenedFile } from '@_redux/main';

import { NodeTreeViewProps } from './types';

export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const { type, content }: OpenedFile = useSelector(Main.globalGetCurrentFileSelector)

  // node-tree-view view state
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const expandedItems = useSelector(Main.fnGetExpandedItemsSelector)
  const expandedItemsObj = useSelector(Main.fnGetExpandedItemsObjSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.fnGetSelectedItemsObjSelector)

  // generate TTree and TreeViewData from file content
  const [treeData, setTreeData] = useState<TTree>({})
  const nodeTreeViewData = useMemo(() => {
    const _treeData: TTree = parseFile({ type, content })
    setTreeData(_treeData)

    let data: TreeViewData = {}
    for (const uid in _treeData) {
      const node: TNode = _treeData[uid]
      data[uid] = {
        index: node.uid,
        data: node,
        children: node.children,
        hasChildren: !node.isEntity,
        canMove: uid !== 'root',
        canRename: uid !== 'root',
      }
    }

    return data
  }, [content])

  /* update the global state */
  const updateFFContent = async (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(Main.updateFileContent(content))
  }

  // add node api
  const handleAddFNNode = (nodeType: string) => {
    // validate
    const focusedNode = treeData[focusedItem]
    if (focusedNode === undefined || focusedNode.isEntity) {
      return
    }

    dispatch(Main.setGlobalPending(true))

    // add node using addNode api
    const tree = JSON.parse(JSON.stringify(treeData))
    let newNode: TNode = {
      uid: '',
      p_uid: null,
      name: nodeType,
      isEntity: false,
      children: [],
      data: {},
    }
    const res = addNode({ tree, targetUid: focusedItem, node: newNode })

    dispatch(Main.setGlobalPending(false))

    // handle response
    if (res.success === true) {
      updateFFContent(tree)
    } else {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: res.error as string,
      }))
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
  const cb_focusNode = useCallback((uid: TUid) => {
    dispatch(Main.focusFNNode(uid))
  }, [])
  const cb_selectNode = useCallback((uids: TUid[]) => {
    // validate the uids
    uids = validateUids(uids)

    // check if it's new state
    if (uids.length === selectedItems.length) {
      let same = true
      for (const uid of uids) {
        if (selectedItemsObj[uid] === undefined) {
          same = false
          break
        }
      }
      if (same) return
    }

    dispatch(Main.selectFNNode(uids))
  }, [selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TUid) => {
    dispatch(Main.expandFNNode([uid]))
  }, [])
  const cb_collapseNode = useCallback((uid: TUid) => {
    dispatch(Main.collapseFNNode([uid]))
  }, [])
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
    <div className="panel">
      <div className="border-bottom" style={{ height: "300px", overflow: "auto" }}>
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Nodes</span>
          </div>
          <div className="gap-s justify-end box">
            {/* Create Folder Button */}
            <div className="icon-addelement opacity-m icon-xs" onClick={() => handleAddFNNode('div')}></div>

            {/* Duplicate Button */}
            <div className="icon-copy opacity-m icon-xs" onClick={handleDuplicateFNNode}></div>

            {/* Delete Node Button */}
            <div className="icon-delete opacity-m icon-xs" onClick={handleRemoveFnNode}></div>
          </div>
        </div>

        {/* Main TreeView */}
        <TreeView
          /* style */
          width={'100%'}
          height={'auto'}

          /* info */
          info={{ id: 'node-tree-view' }}

          /* data */
          data={nodeTreeViewData}
          focusedItem={focusedItem}
          expandedItems={expandedItems}
          selectedItems={selectedItems}

          /* renderers */
          renderers={{
            renderTreeContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItemsContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItem: (props) => {
              return <>
                <li
                  className={cx(
                    props.context.isSelected && '',
                    props.context.isDraggingOver && 'background-secondary',
                    props.context.isDraggingOverParent && '',
                    props.context.isFocused && '',
                  )}
                  {...(props.context.itemContainerWithChildrenProps) as any}
                >
                  {/* self */}
                  <div
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      props.context.isSelected && 'background-secondary',
                      props.context.isDraggingOver && 'color-primary',
                      props.context.isDraggingOverParent && 'draggingOverParent',
                      props.context.isFocused && 'border',
                    )}
                    style={{ flexWrap: "nowrap", paddingLeft: `${props.depth * 10}px` }}

                    {...(props.context.itemContainerWithoutChildrenProps as any)}
                    {...(props.context.interactiveElementProps as any)}
                    onClick={(e) => {
                      e.stopPropagation()

                      props.context.isFocused ? null : props.context.focusItem()

                      if (e.shiftKey) {
                        props.context.selectUpTo()
                      } else if (e.ctrlKey) {
                        props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()
                      } else {
                        props.context.selectItem()
                        props.item.hasChildren ? props.context.toggleExpandedState() : null
                      }
                    }}
                    onFocus={() => { }}
                  >
                    <div className="gap-xs padding-xs" style={{ width: "100%" }}>
                      {/* render arrow */}
                      {props.arrow}

                      {/* render icon */}
                      <div
                        className={cx(
                          'icon-xs',
                          props.item.hasChildren ? (props.context.isExpanded ? 'icon-div' : 'icon-div') :
                            'icon-component'
                        )}
                      >
                      </div>

                      {/* render title */}
                      {props.title}
                    </div>
                  </div>

                  {/* render children */}
                  {props.context.isExpanded ? <>
                    <div>
                      {props.children} {/* this calls the renderItemsContainer again */}
                    </div>
                  </> : null}
                </li>
              </>
            },
            renderItemArrow: (props) => {
              return <>
                <div
                  className={cx(
                    'icon-xs',
                    props.item.hasChildren ? (props.context.isExpanded ? 'icon-down' : 'icon-right') : '',
                  )}
                >
                </div>
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span className='text-s' style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "calc(100% - 32px)" }}>
                  {props.title}
                </span>
              </>
            },
            renderDragBetweenLine: ({ draggingPosition, lineProps }) => (
              <div
                {...lineProps}
                style={{
                  position: 'absolute',
                  right: '0',
                  top:
                    draggingPosition.targetType === 'between-items' &&
                      draggingPosition.linePosition === 'top'
                      ? '0px'
                      : draggingPosition.targetType === 'between-items' &&
                        draggingPosition.linePosition === 'bottom'
                        ? '-4px'
                        : '-2px',
                  left: `${draggingPosition.depth * 10}px`,
                  height: '2px',
                  backgroundColor: 'black',
                }}
              />
            ),
          }}

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
    </div>
  </>)
}