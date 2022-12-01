import React, {
  useCallback,
  useMemo,
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
import { OpenedFile } from '@_redux/main';

import { NodeTreeViewProps } from './types';
import { useEffect } from 'react';

export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const runningActionExists = (actionName: string) => {
    return runningActions.current[actionName] === true ? true : false
  }
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
  const { type, content }: OpenedFile = useSelector(Main.globalGetCurrentFileSelector)

  // node-tree-view view state
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const expandedItems = useSelector(Main.fnGetExpandedItemsSelector)
  const expandedItemsObj = useSelector(Main.fnGetExpandedItemsObjSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.fnGetSelectedItemsObjSelector)

  const treeData: TTree = useSelector(Main.globalGetNodeTreeSelector)


  // generate TTree and TreeViewData from file content
  const [_treeData1, _setTreeData] = useState<TTree>({})
  useEffect(() => {
    dispatch(Main.updateTTree(_treeData1))
  }, [_treeData1])
  const nodeTreeViewData = useMemo(() => {
    const _treeData: TTree = parseFile({ type, content })
    _setTreeData(_treeData)

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
    console.log("update content")
    const content = serializeFile({ type, tree })
    dispatch(Main.updateFileContent(content))
  }

  // add/remove/duplicate node apis
  const handleAddFNNode = (nodeType: string) => {
    // validate
    const focusedNode = treeData[focusedItem]
    if (focusedNode === undefined || focusedNode.isEntity) {
      return
    }

    addRunningAction(['addFNNode'])

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

    removeRunningAction(['addFNNode'])
  }
  const handleRemoveFNNode = () => {
    /* validate the selected items */
    const uids = validateUids(selectedItems)
    if (uids.length === 0) return

    addRunningAction(['removeFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = removeNode({ tree, nodeUids: uids })
    if (res.success === true) {
      updateFFContent(tree)
      dispatch(Main.updateFNNode({ deletedUids: res.deletedUids, convertedUids: res.convertedUids }))
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }

    removeRunningAction(['removeFNNode'])
  }
  const handleDuplicateFNNode = () => {
    /* check if it's root */
    if (focusedItem === 'root') {
      return
    }

    addRunningAction(['duplicateFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const res = duplicateNode({ tree, node: { ...tree[focusedItem] } })
    if (res.success === true) {
      updateFFContent(tree)
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }

    removeRunningAction(['duplicateFNNode'])
  }

  // cb
  const cb_focusNode = useCallback((uid: TUid) => {
    console.log(uid)

    // check running action
    if (!runningActionExists('focusFNNode')) {
      console.log('something wrong with the call backs')
      return
    }

    dispatch(Main.focusFNNode(uid))
    removeRunningAction(['focusFNNode'])
  }, [])
  const cb_selectNode = useCallback((uids: TUid[]) => {
    // check running action
    if (!runningActionExists('selectFNNode')) {
      console.log('something wrong with the call backs')
      return
    }

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
      if (same) {
        removeRunningAction(['selectFNNode'], false)
        return
      }
    }

    dispatch(Main.selectFNNode(uids))
    removeRunningAction(['selectFNNode'])
  }, [selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TUid) => {
    // check running action
    if (!runningActionExists('expandFNNode')) {
      console.log('something wrong with the call backs')
      return
    }

    dispatch(Main.expandFNNode([uid]))
    removeRunningAction(['expandFNNode'])
  }, [])
  const cb_collapseNode = useCallback((uid: TUid) => {
    // check running action
    if (!runningActionExists('collapseFNNode')) {
      console.log('something wrong with the call backs')
      return
    }

    dispatch(Main.collapseFNNode([uid]))
    removeRunningAction(['collapseFNNode'])
  }, [])
  const cb_renameNode = (uid: TUid, newName: string) => {
    // validate
    if (treeData[uid] === undefined || treeData[uid].name === newName) return

    addRunningAction(['renameFNNode'])

    const tree = JSON.parse(JSON.stringify(treeData))
    const node = { ...tree[uid], newName }
    const res = replaceNode({ tree, node })
    if (res.success === true) {
      updateFFContent(tree)
    } else {
      // dispatch(Main.setGlobalError(res.error as string))
    }

    removeRunningAction(['renameFNNode'])
  }
  const cb_dropNode = (payload: { [key: string]: any }) => {
    // validate dnd uids
    let validatedUids: TUid[] = []
    validatedUids = validateUids(payload.uids, payload.parentUid)
    if (validatedUids.length == 0) {
      return
    }

    addRunningAction(['dropFNNode'])

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

    removeRunningAction(['dropFNNode'])
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

                      // check running action
                      if (!noRunningAction()) {
                        return
                      }
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