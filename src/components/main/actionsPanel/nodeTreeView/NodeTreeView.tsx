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
import { Panel } from 'react-resizable-panels';

import {
  SVGIconI,
  SVGIconII,
  SVGIconIII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import {
  addNode,
  copyNode,
  duplicateNode,
  getNodeChildIndex,
  getValidNodeUids,
  moveNode,
  removeNode,
  THtmlNodeData,
} from '@_node/index';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import {
  collapseFNNode,
  expandFNNode,
  fnSelector,
  focusFNNode,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
  updateFNTreeViewState,
} from '@_redux/main';

import { NodeTreeViewProps } from './types';

export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,
    // event
    event, setEvent,
    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, nodeMaxUid, setNodeMaxUid,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // panel-resize
    panelResizing,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  const focusedItemRef = useRef<TNodeUid>(focusedItem)

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
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      }
    }
    return data
  }, [validNodeTree])

  // sync from redux
  useEffect(() => {
    // validate
    const node = validNodeTree[focusedItem]
    if (node === undefined) return

    // skip its own change
    if (focusedItemRef.current === focusedItem) return

    const focusedComponent = document.getElementById(`NodeTreeView-${focusedItem}`)
    focusedComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [focusedItem])

  const cb_addNode = useCallback((nodeType: string) => {
    // validate
    if (focusedItem === RootNodeUid) return

    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return

    // build node
    const newNode: TNode = {
      uid: String(nodeMaxUid + 1) as TNodeUid,
      parentUid: focusedNode.parentUid as TNodeUid,
      name: nodeType,
      isEntity: true,
      children: [],
      data: {
        valid: true,
        isFormatText: false,

        type: 'tag',
        name: nodeType,
        data: '',
        attribs: { [NodeInAppAttribName]: String(nodeMaxUid + 1) as TNodeUid },

        html: '',
        htmlInApp: '',

        startLineNumber: 0,
        startColumn: 0,
        endLineNumber: 0,
        endColumn: 0,
      } as THtmlNodeData
    }

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // add node
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = addNode(tree, focusedItem, newNode, 'html', String(nodeMaxUid + 1) as TNodeUid, osType, tabSize)

    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    setEvent({ type: 'add-node', param: [newNode] })

    dispatch(updateFNTreeViewState(res))
  }, [focusedItem, validNodeTree, nodeTree, nodeMaxUid, osType, tabSize])
  const cb_removeNode = useCallback(() => {
    // validate
    if (selectedItems.length === 0) return

    addRunningActions(['nodeTreeView-remove'])

    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = removeNode(tree, selectedItems, 'html')

    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })

     setNodeTree(res.tree)

    dispatch(updateFNTreeViewState(res))

    setEvent({ type: 'remove-node', param: selectedItems })

    removeRunningActions(['nodeTreeView-remove'], false)
  }, [selectedItems, nodeTree])
  const cb_duplicateNode = useCallback(() => {
    // validate
    const uids = selectedItems.filter((uid) => uid !== RootNodeUid && validNodeTree[uid] !== undefined)
    if (uids.length === 0) return

    addRunningActions(['processor-nodeTree'])

    // duplicate the node
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = duplicateNode(tree, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    dispatch(updateFNTreeViewState(res))
  }, [selectedItems, validNodeTree, nodeTree, osType, tabSize, nodeMaxUid])
  const cb_copyNode = useCallback((_uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    // validate
    let uids: TNodeUid[] = [..._uids]
    uids = uids.filter((uid) => validNodeTree[uid] !== undefined)
    if (uids.length === 0 || validNodeTree[targetUid] === undefined) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // copy the nodes
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = copyNode(tree, targetUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    setNodeMaxUid(Number(res.nodeMaxUid as TNodeUid))

    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    dispatch(updateFNTreeViewState(res))
  }, [validNodeTree, nodeTree, osType, tabSize, nodeMaxUid])
  const cb_moveNode = useCallback((_uids: TNodeUid[], parentUid: TNodeUid, isBetween: boolean, position: number) => {
    // validate
    let uids: TNodeUid[] = []
    uids = getValidNodeUids(validNodeTree, _uids, parentUid)
    uids = uids.filter((uid) => {
      return validNodeTree[uid] !== undefined
    })
    if (uids.length === 0 || validNodeTree[parentUid] === undefined) return

    addRunningActions(['processor-nodeTree', 'processor-validNodeTree'])

    // drop the nodes
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = moveNode(tree, parentUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    dispatch(updateFNTreeViewState(res))
  }, [validNodeTree, nodeTree, osType, tabSize, nodeMaxUid])

  const cb_focusNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-focus'])

    // validate
    if (focusedItem === uid) {
      removeRunningActions(['nodeTreeView-focus'], false)
      return
    }

    dispatch(focusFNNode(uid))
    focusedItemRef.current = uid

    removeRunningActions(['nodeTreeView-focus'])
  }, [focusedItem])
  const cb_selectNode = useCallback((uids: TNodeUid[]) => {
    // for key-nav
    addRunningActions(['nodeTreeView-select'])

    // validate
    const _uids = getValidNodeUids(validNodeTree, uids)
    if (_uids.length === selectedItems.length) {
      let same = true
      for (const _uid of _uids) {
        if (selectedItemsObj[_uid] === undefined) {
          same = false
          break
        }
      }
      if (same) {
        removeRunningActions(['nodeTreeView-select'], false)
        return
      }
    }

    dispatch(selectFNNode(_uids))

    removeRunningActions(['nodeTreeView-select'])
  }, [validNodeTree, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-expand'])

    dispatch(expandFNNode([uid]))

    removeRunningActions(['nodeTreeView-expand'])
  }, [])
  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['nodeTreeView-collapse'])

    dispatch(collapseFNNode([uid]))

    removeRunningActions(['nodeTreeView-collapse'])
  }, [])

  useEffect(() => {
    if (event) {
      const { type, param } = event
      switch (type) {
        default:
          break
      }
    }
  }, [event])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
  // command detect & do actions
  useEffect(() => {
    if (activePanel !== 'node' && activePanel !== 'stage') return

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
  }, [currentCommand])

  // command handlers
  const onActions = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Actions'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, 'Add'])
    setCmdkOpen(true)
  }, [cmdkPages])

  const onCut = useCallback(() => {
    setClipboardData({ panel: 'node', type: 'cut', uids: selectedItems })
  }, [selectedItems])
  const onCopy = useCallback(() => {
    setClipboardData({ panel: 'node', type: 'copy', uids: selectedItems })
  }, [selectedItems])
  const onPaste = useCallback(() => {
    // validate cmdk
    if (activePanel !== 'node' && activePanel !== 'stage') return
    if (clipboardData.panel !== 'node') return

    // valid node
    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return
    const parentNode = validNodeTree[focusedNode.parentUid as TNodeUid]
    if (parentNode === undefined) return

    const childIndex = getNodeChildIndex(parentNode, focusedNode)

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'node', type: 'cut', uids: [] })
      cb_moveNode(clipboardData.uids, parentNode.uid, true, childIndex + 1)
    } else if (clipboardData.type === 'copy') {
      cb_copyNode(clipboardData.uids, parentNode.uid, true, childIndex + 1)
    }
  }, [activePanel, clipboardData, focusedItem, validNodeTree, cb_moveNode, cb_copyNode])

  const onDelete = useCallback(() => {
    cb_removeNode()
  }, [cb_removeNode])
  const onDuplicate = useCallback(() => {
    cb_duplicateNode()
  }, [cb_duplicateNode])
  const onTurnInto = useCallback(() => {
  }, [])
  const onGroup = useCallback(() => {
  }, [])
  const onUngroup = useCallback(() => {
  }, [])
  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith('AddNode-') === false) return

    const tagName = actionName.slice(9, actionName.length - 1)
    cb_addNode(tagName)
  }, [cb_addNode])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('node')
  }, [])

  useEffect(() => {
    console.log(focusedItem, selectedItems, expandedItems)
  }, [focusedItem, selectedItems, expandedItems])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return useMemo(() => {
    return <>
      <Panel minSize={0}>
        <div
          id="NodeTreeView"
          className={cx(
            'scrollable',
          )}
          style={{
            pointerEvents: panelResizing ? 'none' : 'auto',
          }}
          onClick={onPanelClick}
        >
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
            selectedItems={selectedItems}
            expandedItems={expandedItems}

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
                console.log('node tree item render')
                return <>
                  <li
                    key={props.item.data.uid}
                    className={cx(
                      props.context.isSelected && 'background-secondary',

                      props.context.isDraggingOver && '',
                      props.context.isDraggingOverParent && '',

                      props.context.isFocused && '',
                    )}
                    {...props.context.itemContainerWithChildrenProps}
                  >
                    <div
                      id={`NodeTreeView-${props.item.index}`}
                      className={cx(
                        'justify-stretch',
                        'padding-xs',

                        'outline-default',

                        // props.item.index === fnHoveredItem ? 'outline' : '',

                        props.context.isExpanded && props.context.isSelected && 'background-tertiary',
                        !props.context.isExpanded && props.context.isSelected && 'background-secondary',

                        props.context.isSelected && 'outline-none',
                        !props.context.isSelected && props.context.isFocused && 'outline',

                        props.context.isDraggingOver && '',
                        props.context.isDraggingOverParent && '',
                      )}
                      style={{
                        flexWrap: "nowrap",
                        paddingLeft: `${props.depth * 10}px`,
                      }}

                      {...props.context.itemContainerWithoutChildrenProps}
                      {...props.context.interactiveElementProps}
                      onClick={(e) => {
                        e.stopPropagation()

                        !props.context.isFocused && addRunningActions(['nodeTreeView-focus'])
                        addRunningActions(['nodeTreeView-select'])

                        removeRunningActions(['nodeTreeView-arrowClick'])

                        props.context.isFocused ? null : props.context.focusItem()

                        // e.shiftKey ? props.context.selectUpTo() :
                        e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) :
                          props.context.selectItem()
                      }}
                      onFocus={() => { }}
                      onMouseEnter={() => setFNHoveredItem(props.item.index as TNodeUid)}
                      onMouseLeave={() => setFNHoveredItem('')}
                    >
                      <div className="gap-xs padding-xs" style={{ width: "100%" }}>
                        {props.arrow}

                        {props.item.isFolder ?
                          props.context.isExpanded ?
                            <SVGIconI {...{ "class": "icon-xs" }}>div</SVGIconI>
                            : <SVGIconII {...{ "class": "icon-xs" }}>div</SVGIconII>
                          : <SVGIconIII {...{ "class": "icon-xs" }}>component</SVGIconIII>}


                        {props.title}
                      </div>
                    </div>

                    {props.context.isExpanded ? <>
                      <div>
                        {props.children}
                      </div>
                    </> : null}
                  </li>
                </>
              },
              renderItemArrow: (props) => {
                return <>
                  {props.item.isFolder ?
                    (props.context.isExpanded ?
                      <SVGIconI {...{
                        "class": "icon-xs",
                        "onClick": (e: MouseEvent) => {
                          addRunningActions(['nodeTreeView-arrowClick, nodeTreeView-collapse'])
                          props.context.toggleExpandedState()
                        },
                      }}>down</SVGIconI> :
                      <SVGIconII {...{
                        "class": "icon-xs",
                        "onClick": (e: MouseEvent) => {
                          addRunningActions(['nodeTreeView-arrowClick, nodeTreeView-expand'])
                          props.context.toggleExpandedState()
                        },
                      }}>right</SVGIconII>)
                    : <div
                      className='icon-xs'
                      onClick={(e) => {
                        addRunningActions(['nodeTreeView-arrowClick'])
                      }}
                    >
                    </div>}
                </>
              },
              renderItemTitle: (props) => {
                return <>
                  <span
                    className='text-s justify-stretch'
                    style={{
                      width: "calc(100% - 32px)",
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {props.title}
                  </span>
                </>
              },
              renderDragBetweenLine: ({ draggingPosition, lineProps }) => (
                <div
                  {...lineProps}
                  className={'foreground-tertiary'}
                  style={{
                    position: 'absolute',
                    right: '0',
                    top:
                      draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'top' ? '0px'
                        : draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'bottom' ? '-4px'
                          : '-2px',
                    left: `${draggingPosition.depth * 10}px`,
                    height: '2px',
                  }}
                />
              ),
            }}

            props={{
              canDragAndDrop: true,
              canDropOnFolder: true,
              canDropOnNonFolder: true,
              canReorderItems: true,

              canSearch: false,
              canSearchByStartingTyping: false,
              canRename: false,
            }}

            callbacks={{
              onSelectItems: (items) => {
                cb_selectNode(items as TNodeUid[])
              },
              onFocusItem: (item) => {
                cb_focusNode(item.index as TNodeUid)
              },
              onExpandItem: (item) => {
                cb_expandNode(item.index as TNodeUid)
              },
              onCollapseItem: (item) => {
                cb_collapseNode(item.index as TNodeUid)
              },
              onDrop: (items, target) => {
                const uids: TNodeUid[] = items.map(item => item.index as TNodeUid)
                const isBetween = target.targetType === 'between-items'
                const parentUid = (isBetween ? target.parentItem : target.targetItem) as TNodeUid
                const position = isBetween ? target.childIndex : 0

                cb_moveNode(uids, parentUid, isBetween, position)
              },
            }}
          />
        </div>
      </Panel>
    </>
  }, [
    panelResizing, onPanelClick,
    nodeTreeViewData,
    focusedItem, selectedItems, expandedItems,
    addRunningActions, removeRunningActions,
    cb_selectNode, cb_focusNode, cb_expandNode, cb_collapseNode, cb_moveNode,
  ])
}