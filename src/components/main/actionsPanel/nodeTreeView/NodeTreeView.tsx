import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  copyNode,
  duplicateNode,
  getBfsUids,
  moveNode,
  removeNode,
  replaceNode,
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

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    os,
  } = useContext(Main.MainContext)

  // redux state
  const { project, currentFile } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // nodeTree -> validNodeTree
  useEffect(() => {
    const _nodeTree: TTree = JSON.parse(JSON.stringify(nodeTree))
    const _validNodeTree: TTree = {}

    let uids: TUid[] = Object.keys(_nodeTree)
    uids = getBfsUids(uids)
    uids.reverse()
    uids.map((uid) => {
      const node = _nodeTree[uid]

      // validate
      if (node.children.length !== 0) {
        node.children = node.children.filter((c_uid) => {
          return _nodeTree[c_uid].data.valid
        })
        node.isEntity = (node.children.length === 0)
      }

      // add only validated node
      node.data.valid ? _validNodeTree[uid] = node : null
    })

    setValidNodeTree(_validNodeTree)
  }, [nodeTree])

  // validNodeTree -> nodeTreeViewData
  const nodeTreeViewData = useMemo(() => {
    let data: TreeViewData = {}
    for (const uid in validNodeTree) {
      const node = validNodeTree[uid]
      data[uid] = {
        index: node.uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== 'ROOT',
        canRename: uid !== 'ROOT',
      }
    }
    return data
  }, [validNodeTree])

  // focusedItem -> scrollTo
  const focusedItemRef = useRef<TUid>(focusedItem)
  useEffect(() => {
    // validate
    const node = validNodeTree[focusedItem]
    if (node === undefined) return

    // skip own state change
    if (focusedItemRef.current === focusedItem) {
      focusedItemRef.current = ''
      return
    }

    // scroll to focused item
    const focusedComponent = document.getElementById(`NodeTreeView-${focusedItem}`)
    setTimeout(() => focusedComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 0)

    focusedComponent?.focus()
  }, [focusedItem])

  // node actions -> nodeTree
  const handleAddFNNode = useCallback((nodeType: string) => {
    // validate
    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return

    // build the new node to add
    const tree = JSON.parse(JSON.stringify(nodeTree))
    let newNode: TNode = {
      uid: '',
      p_uid: focusedItem,
      name: nodeType,
      isEntity: true,
      children: [],
      data: {},
    }

    // fill in data prop for the node
    /* if (nodeType === 'div') {
      newNode.data = {
        valid: true,
        isFormatText: false,

        type: 'tag',
        name: 'div',
        data: undefined,
        attribs: {},

        // startLineNumber: '',
        // startColumn: '',
        // endLineNumber: '',
        // endColumn: '',

        // html: '',
      }
    } else {
      // do nothing
      newNode.data = {
        valid: true,
        isFormatText: false,

        type: 'tag',
        name: nodeType,
        data: undefined,
        attribs: {},

        // startLineNumber: '',
        // startColumn: '',
        // endLineNumber: '',
        // endColumn: '',

        // html: '',
      }
    } */
    newNode.data = {
      valid: true,
      isFormatText: false,

      type: 'tag',
      name: nodeType,
      data: undefined,
      attribs: {},

      // startLineNumber: '',
      // startColumn: '',
      // endLineNumber: '',
      // endColumn: '',

      // html: '',
    }

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // add node
    const res = addNode({ tree, targetUid: focusedItem, node: newNode, os })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    dispatch(Main.updateFNTreeViewState(res))
  }, [focusedItem, validNodeTree, nodeTree])
  const handleRemoveFNNode = useCallback(() => {
    // validate
    if (selectedItems.length === 0) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // remove the nodes
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = removeNode({ tree, nodeUids: selectedItems })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    dispatch(Main.updateFNTreeViewState(res))
  }, [selectedItems, nodeTree])
  const handleDuplicateFNNode = useCallback(() => {
    // validate
    if (focusedItem === 'ROOT') return
    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // duplicate the node
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = duplicateNode({ tree, node: focusedNode, os })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    dispatch(Main.updateFNTreeViewState(res))
  }, [focusedItem, validNodeTree, nodeTree])
  const _copy = useCallback((targetUid: TUid, _uids: TUid[]) => {
    // validate
    let uids: TUid[] = [..._uids]
    uids = uids.filter((uid) => {
      return validNodeTree[uid] !== undefined
    })
    if (uids.length === 0 || validNodeTree[targetUid] === undefined) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // drop the nodes
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = copyNode({ tree, targetUid, uids, os })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    dispatch(Main.updateFNTreeViewState(res))
  }, [validNodeTree, nodeTree])
  const cb_renameNode = useCallback((uid: TUid, newName: string) => {
    // validate
    const focusedNode = validNodeTree[uid]
    if (focusedNode === undefined || focusedNode.name === newName) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // rename the node
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const node = { ...JSON.parse(JSON.stringify(tree[uid])), name: newName }
    replaceNode({ tree, node })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(tree)
  }, [validNodeTree, nodeTree])
  const cb_dropNode = useCallback((payload: {
    parentUid: TUid,
    isBetween: boolean,
    position: number,
    uids: TUid[],
  }) => {
    // validate
    let uids: TUid[] = []
    uids = validateUids(payload.uids, payload.parentUid)
    uids = uids.filter((uid) => {
      return validNodeTree[uid] !== undefined
    })
    if (uids.length === 0 || validNodeTree[payload.parentUid] === undefined) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // drop the nodes
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = moveNode({
      tree,
      isBetween: payload.isBetween,
      parentUid: payload.parentUid,
      position: payload.position,
      uids: uids,
      os,
    })
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    dispatch(Main.updateFNTreeViewState(res))
  }, [validNodeTree, nodeTree])

  // fn view state
  const cb_focusNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-focus'])

    // validate
    if (focusedItem === uid || validNodeTree[uid] === undefined) {
      removeRunningActions(['nodeTreeView-focus'], false)
      return
    }

    focusedItemRef.current = uid
    dispatch(Main.focusFNNode(uid))

    removeRunningActions(['nodeTreeView-focus'])
  }, [focusedItem, validNodeTree])
  const cb_selectNode = useCallback((uids: TUid[]) => {
    // for key-nav
    addRunningActions(['nodeTreeView-select'])

    // validate
    let _uids = [...uids]
    _uids = validateUids(_uids)
    _uids = _uids.filter((_uid) => {
      return validNodeTree[_uid] !== undefined
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
        removeRunningActions(['nodeTreeView-select'], false)
        return
      }
    }

    dispatch(Main.selectFNNode(_uids))

    removeRunningActions(['nodeTreeView-select'])
  }, [validNodeTree, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-expand'])

    // validate
    const node = validNodeTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === true) {
      removeRunningActions(['nodeTreeView-expand'], false)
      return
    }

    dispatch(Main.expandFNNode([uid]))

    removeRunningActions(['nodeTreeView-expand'])
  }, [validNodeTree, expandedItemsObj])
  const cb_collapseNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-collapse'])

    // validate
    const node = validNodeTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === undefined) {
      removeRunningActions(['nodeTreeView-collapse'], false)
      return
    }

    dispatch(Main.collapseFNNode([uid]))

    removeRunningActions(['nodeTreeView-collapse'])
  }, [validNodeTree, expandedItemsObj])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    addRunningActions(['nodeTreeView-focus'])

    setActivePanel('node')

    const uid = 'ROOT'

    // validate
    if (focusedItem === uid || validNodeTree[uid] === undefined) {
      removeRunningActions(['nodeTreeView-focus'], false)
      return
    }

    focusedItemRef.current = uid
    dispatch(Main.selectFNNode([]))
    dispatch(Main.focusFNNode(uid))

    removeRunningActions(['nodeTreeView-focus'])
  }, [focusedItem, validNodeTree])

  // command detect & do actions
  useEffect(() => {
    if (activePanel !== 'node') return

    if (currentCommand.action === '') return

    switch (currentCommand.action) {
      case 'Actions':
        onActions()
        break
      case 'Add':
        onAdd()
        break
      case 'Cut':
        onCut()
        break
      case 'Copy':
        onCopy()
        break
      case 'Paste':
        onPaste()
        break
      case 'Delete':
        onDelete()
        break
      case 'Duplicate':
        onDuplicate()
        break
      case 'Turn into':
        onTurnInto()
        break
      case 'Group':
        onGroup()
        break
      case 'Ungroup':
        onUngroup()
        break
      default:
        onAddNode(currentCommand.action)
        break
    }
  }, [currentCommand.changed])

  // command handlers
  const onActions = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Actions'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, 'Add'])
    setCmdkOpen(true)
  }, [cmdkOpen, cmdkPages])
  const onCut = useCallback(() => {
    setClipboardData({ panel: 'node', type: 'cut', uids: selectedItems })
  }, [selectedItems])
  const onCopy = useCallback(() => {
    setClipboardData({ panel: 'node', type: 'copy', uids: selectedItems })
  }, [selectedItems])
  const onPaste = useCallback(() => {
    if (activePanel !== 'node') return
    if (clipboardData.panel !== 'node') return

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'node', type: 'cut', uids: [] })
      cb_dropNode({ parentUid: focusedItem, isBetween: false, position: 0, uids: clipboardData.uids })
    } else if (clipboardData.type === 'copy') {
      _copy(focusedItem, clipboardData.uids)
    }
  }, [activePanel, clipboardData, cb_dropNode, _copy, focusedItem])
  const onDelete = useCallback(() => {
    handleRemoveFNNode()
  }, [handleRemoveFNNode])
  const onDuplicate = useCallback(() => {
    handleDuplicateFNNode()
  }, [handleDuplicateFNNode])
  const onTurnInto = useCallback(() => {
  }, [])
  const onGroup = useCallback(() => {
  }, [])
  const onUngroup = useCallback(() => {
  }, [])
  const onAddNode = useCallback((actionName: string) => {
    // console.log(actionName)
    if (actionName.startsWith('AddNode-') === false) return
    const tagName = actionName.slice(9, actionName.length - 1)
    // console.log('Add Tag', tagName)
    handleAddFNNode(tagName)
  }, [handleAddFNNode])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // Web Component - svg-icon
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <div className="panel">
      <div
        className="border-bottom"
        style={{
          height: "calc(50vh)",
          overflow: "auto",
          background: (focusedItem === 'ROOT' && validNodeTree['ROOT'] !== undefined) ? "rgba(0, 0, 0, 0.02)" : "none",
        }}
        onClick={onPanelClick}
      >
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Nodes</span>
          </div>
          <div className="gap-s justify-end box">
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
                  {...props.context.itemContainerWithChildrenProps}
                >
                  {/* self */}
                  <div
                    id={`NodeTreeView-${props.item.index}`}
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      props.item.index === fnHoveredItem && 'background-secondary',
                      props.context.isSelected && 'background-secondary',
                      props.context.isDraggingOver && 'foreground-primary',
                      props.context.isDraggingOverParent && '',
                      props.context.isFocused && '',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 10}px`,
                      outline: props.context.isFocused ? "1px solid black" :
                        props.item.index === fnHoveredItem ? "1px dotted black" : "none",
                      outlineOffset: "-1px",
                    }}

                    {...props.context.itemContainerWithoutChildrenProps}
                    {...props.context.interactiveElementProps}
                    onClick={(e) => {
                      e.stopPropagation()

                      // group action
                      !props.context.isFocused && addRunningActions(['nodeTreeView-focus'])
                      addRunningActions(['nodeTreeView-select'])

                      removeRunningActions(['nodeTreeView-arrowClick'])

                      // call back
                      props.context.isFocused ? null : props.context.focusItem()

                      e.shiftKey ? props.context.selectUpTo() :
                        e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) :
                          props.context.selectItem()
                    }}
                    onFocus={() => { }}
                    onMouseEnter={() => setFNHoveredItem(props.item.index as TUid)}
                    onMouseLeave={() => setFNHoveredItem('')}
                  >
                    <div className="gap-xs padding-xs" style={{ width: "100%" }}>
                      {/* render arrow */}
                      {props.arrow}

                      {/* render icon */}
                      <SVGIcon style={{ display: "flex" }}>
                        {props.item.isFolder ? (props.context.isExpanded ? 'objects/div' : 'objects/div') :
                          'objects/component'}
                      </SVGIcon>

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
                {props.item.isFolder ? <SVGIcon
                  style={{ display: "flex" }}
                  onClick={(e) => {
                    // to merge with the click event
                    addRunningActions(['nodeTreeView-arrowClick'])

                    addRunningActions([props.context.isExpanded ? 'nodeTreeView-collapse' : 'nodeTreeView-expand'])

                    // callback
                    props.context.toggleExpandedState()
                  }}>
                  {props.context.isExpanded ? 'arrows/down' : 'arrows/right'}
                </SVGIcon> : <div
                  className='icon-xs'
                  onClick={(e) => {
                    // to merge with the click event
                    addRunningActions(['nodeTreeView-arrowClick'])
                  }}
                >
                </div>}
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span className='text-s justify-stretch' style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "calc(100% - 32px)" }}>
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
                    draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'top' ? '0px'
                      : draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'bottom' ? '-4px'
                        : '-2px',
                  left: `${draggingPosition.depth * 10}px`,
                  height: '2px',
                  backgroundColor: 'red',
                }}
              />
            ),
          }}

          /* possibilities */
          props={{
            canDragAndDrop: true,
            canDropOnFolder: true,
            canDropOnNonFolder: true,
            canReorderItems: true,

            canSearch: false,
            canSearchByStartingTyping: false,
          }}

          /* cb */
          callbacks={{
            /* RENAME CALLBACK */
            onRenameItem: (item, name) => {
              cb_renameNode(item.index as TUid, name)
            },

            /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
            onSelectItems: (items) => {
              cb_selectNode(items as TUid[])
            },
            onFocusItem: (item) => {
              cb_focusNode(item.index as TUid)
            },
            onExpandItem: (item) => {
              cb_expandNode(item.index as TUid)
            },
            onCollapseItem: (item) => {
              cb_collapseNode(item.index as TUid)
            },

            // DnD CALLBACK
            onDrop: (items, target) => {
              // building drop-node-payload
              const uids: TUid[] = items.map(item => item.index as TUid)
              const isBetween = target.targetType === 'between-items'
              const parentUid = (isBetween ? target.parentItem : target.targetItem) as TUid
              const position = isBetween ? target.childIndex : 0

              cb_dropNode({ uids: uids, isBetween, parentUid, position })
            }
          }}
        />
      </div>
    </div>
  </>
}