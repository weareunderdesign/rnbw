import React, {
  useCallback,
  useEffect,
  useRef,
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

import { NodeTreeViewProps } from './types';

export default function NodeTreeView(props: NodeTreeViewProps) {
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

  // fetch necessary state
  const { type, content }: Main.OpenedFile = useSelector(Main.globalGetCurrentFileSelector)
  const treeData: TTree = useSelector(Main.globalGetNodeTreeSelector)

  // node-tree-view view state
  const hoveredItem = useSelector(Main.fnGetHoveredItemSelector)
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const expandedItems = useSelector(Main.fnGetExpandedItemsSelector)
  const expandedItemsObj = useSelector(Main.fnGetExpandedItemsObjSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.fnGetSelectedItemsObjSelector)

  // generate TTree and TreeViewData from file content
  const [nodeTreeViewData, setNodeTreeViewData] = useState<TreeViewData>({})
  useEffect(() => {
    const _treeData: TTree = parseFile({ type, content })

    // update global state
    dispatch(Main.updateFNTreeView(_treeData))

    // generate data for node-tree-view
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
    setNodeTreeViewData(data)
  }, [type, content])

  // update the file content
  const updateFFContent = useCallback(async (tree: TTree) => {
    const newContent = serializeFile({ type, tree })
    dispatch(Main.updateFileContent(newContent))
  }, [type])

  // add/remove/duplicate node apis
  const handleAddFNNode = useCallback((nodeType: string) => {
    // validate
    const focusedNode = treeData[focusedItem]
    if (focusedNode === undefined) return

    addRunningAction(['addFNNode'])

    // add node using addNode api
    const tree = JSON.parse(JSON.stringify(treeData))
    let newNode: TNode = {
      uid: '',
      p_uid: null,
      name: nodeType,
      isEntity: true,
      children: [],
      data: {},
    }
    addNode({ tree, targetUid: focusedItem, node: newNode })
    updateFFContent(tree)

    removeRunningAction(['addFNNode'])
  }, [treeData, focusedItem])
  const handleRemoveFNNode = useCallback(() => {
    // validate
    if (selectedItems.length === 0) return

    addRunningAction(['removeFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = removeNode({ tree, nodeUids: selectedItems })
    updateFFContent(res.tree)
    dispatch(Main.updateFNTreeViewState(res))

    removeRunningAction(['removeFNNode'])
  }, [selectedItems, treeData])
  const handleDuplicateFNNode = useCallback(() => {
    // validate
    if (focusedItem === 'root') return
    const focusedNode = treeData[focusedItem]
    if (focusedNode === undefined || focusedNode === null) return

    addRunningAction(['duplicateFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = duplicateNode({ tree, node: focusedNode })
    updateFFContent(res.tree)
    dispatch(Main.updateFNTreeViewState(res))

    removeRunningAction(['duplicateFNNode'])
  }, [focusedItem, treeData])

  // cb
  const cb_focusNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningAction(['focusFNNode'])

    // validate
    if (focusedItem === uid || treeData[uid] === undefined) {
      removeRunningAction(['focusFNNode'], false)
      return
    }

    dispatch(Main.focusFNNode(uid))
    removeRunningAction(['focusFNNode'])
  }, [focusedItem, treeData])
  const cb_selectNode = useCallback((uids: TUid[]) => {
    // for key-nav
    addRunningAction(['selectFNNode'])

    // validate
    let _uids = [...uids]
    _uids = validateUids(_uids)
    _uids = _uids.filter((_uid) => {
      return !(treeData[_uid] === undefined)
    })

    // check if it's new state
    if (_uids.length === selectedItems.length) {
      let same = true
      for (const uid of uids) {
        if (selectedItemsObj[uid] === undefined) {
          same = false
          break
        }
      }
      if (same) {
        removeRunningAction(['selectFNNode'], false)
        return
      }
    }

    dispatch(Main.selectFNNode(_uids))
    removeRunningAction(['selectFNNode'])
  }, [treeData, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningAction(['expandFNNode'])

    // validate
    const node = treeData[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === true) {
      removeRunningAction(['expandFNNode'], false)
      return
    }

    dispatch(Main.expandFNNode([uid]))
    removeRunningAction(['expandFNNode'])
  }, [treeData, expandedItemsObj])
  const cb_collapseNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningAction(['collapseFNNode'])

    // validate
    const node = treeData[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === undefined) {
      removeRunningAction(['collapseFNNode'], false)
      return
    }

    dispatch(Main.collapseFNNode([uid]))
    removeRunningAction(['collapseFNNode'])
  }, [treeData, expandedItemsObj])
  const cb_renameNode = useCallback((uid: TUid, newName: string) => {
    // validate
    const focusedNode = treeData[uid]
    if (focusedNode === undefined || focusedNode.name === newName) return

    addRunningAction(['renameFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const node = { ...tree[uid], name: newName }
    replaceNode({ tree, node })
    updateFFContent(tree)

    removeRunningAction(['renameFNNode'])
  }, [treeData])
  const cb_dropNode = useCallback((payload: { [key: string]: any }) => {
    // validate
    let uids: TUid[] = []
    uids = validateUids(payload.uids, payload.parentUid)
    if (uids.length == 0 || treeData[payload.parentUid] === undefined) return

    addRunningAction(['dropFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = moveNode({
      tree,
      isBetween: payload.isBetween,
      parentUid: payload.parentUid,
      position: payload.position,
      uids: uids
    })
    updateFFContent(res.tree)
    dispatch(Main.updateFNTreeViewState(res))

    removeRunningAction(['dropFNNode'])
  }, [treeData])

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
            <div className="icon-delete opacity-m icon-xs" onClick={handleRemoveFNNode}></div>
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
                      props.item.index === hoveredItem && 'background-secondary',
                      props.context.isSelected && 'background-secondary',
                      props.context.isDraggingOver && 'color-primary',
                      props.context.isDraggingOverParent && 'draggingOverParent',
                      props.context.isFocused && 'border',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 10}px`,
                      ...(!props.context.isFocused ? { border: "1px solid transparent" } : {}),
                    }}

                    {...(props.context.itemContainerWithoutChildrenProps as any)}
                    {...(props.context.interactiveElementProps as any)}
                    onClick={(e) => {
                      e.stopPropagation()

                      if (!props.context.isFocused) {
                        addRunningAction(['focusFNNode'])
                      }
                      if (e.shiftKey) {
                        addRunningAction(['selectFNNode'])
                      } else if (e.ctrlKey) {
                        addRunningAction(['selectFNNode'])
                      } else {
                        addRunningAction(['selectFNNode'])
                      }

                      removeRunningAction(['clickEvent'])

                      // call back
                      props.context.isFocused ? null : props.context.focusItem()
                      if (e.shiftKey) {
                        props.context.selectUpTo()
                      } else if (e.ctrlKey) {
                        props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()
                      } else {
                        props.context.selectItem()
                      }
                    }}
                    onFocus={() => { }}
                    onMouseMove={() => {
                      dispatch(Main.hoverFNNode(props.item.index as TUid))
                    }}
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
                  onClick={(e) => {
                    // check running action
                    if (props.item.hasChildren) {
                      addRunningAction([props.context.isExpanded ? 'collapseFNNode' : 'expandFNNode'])
                    } else {
                      // do nothing
                    }

                    // to merge with the click event
                    addRunningAction(['clickEvent'])

                    // call back
                    props.item.hasChildren ? props.context.toggleExpandedState() : null
                  }}
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
            canDropOnItemWithoutChildren: true,
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