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
  AddNodeActionPrefix,
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
  MainContext,
  selectFNNode,
} from '@_redux/main';
import {
  addClass,
  removeClass,
} from '@_services/main';

import { NodeTreeViewProps } from './types';

export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
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
    addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // panel-resize
    panelResizing,
  } = useContext(MainContext)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  useEffect(() => {
    if (hoveredItemRef.current === fnHoveredItem) return

    const curHoveredElement = document.querySelector(`#NodeTreeView-${hoveredItemRef.current}`)
    curHoveredElement?.setAttribute('class', removeClass(curHoveredElement.getAttribute('class') || '', 'outline'))
    const newHoveredElement = document.querySelector(`#NodeTreeView-${fnHoveredItem}`)
    newHoveredElement?.setAttribute('class', addClass(newHoveredElement.getAttribute('class') || '', 'outline'))

    hoveredItemRef.current = fnHoveredItem
  }, [fnHoveredItem])
  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const focusedElement = document.querySelector(`#NodeTreeView-${focusedItem}`)
    setTimeout(() => focusedElement?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 0)

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // build nodeTreeViewData
  const nodeTreeViewData = useMemo(() => {
    const data: TreeViewData = {}
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
  // -------------------------------------------------------------- node actions handlers --------------------------------------------------------------
  const cb_addNode = useCallback((nodeType: string) => {
    if (!nodeTree[focusedItem]) return

    addRunningActions(['nodeTreeView-add'])

    // build node to add
    const newNode: TNode = {
      uid: String(nodeMaxUid + 1) as TNodeUid,
      parentUid: nodeTree[focusedItem].parentUid as TNodeUid,
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

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree))
    const res = addNode(tree, focusedItem, newNode, 'html', String(nodeMaxUid + 1) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])

    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'add-node', param: [focusedItem, newNode] })

    removeRunningActions(['nodeTreeView-add'])
  }, [addRunningActions, removeRunningActions, nodeTree, focusedItem, nodeMaxUid, osType, tabSize])
  const cb_removeNode = useCallback((uids: TNodeUid[]) => {
    addRunningActions(['nodeTreeView-remove'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = removeNode(tree, uids, 'html')

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])

    // side effect
    setEvent({ type: 'remove-node', param: [uids, res.deletedUids] })

    removeRunningActions(['nodeTreeView-remove'])
  }, [addRunningActions, removeRunningActions, nodeTree])
  const cb_duplicateNode = useCallback((uids: TNodeUid[]) => {
    addRunningActions(['nodeTreeView-duplicate'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = duplicateNode(tree, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])

    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'duplicate-node', param: [uids, res.addedUidMap] })

    removeRunningActions(['nodeTreeView-duplicate'])
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize])
  const cb_copyNode = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    addRunningActions(['nodeTreeView-copy'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = copyNode(tree, targetUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])

    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'copy-node', param: [uids, targetUid, isBetween, position, res.addedUidMap] })

    removeRunningActions(['nodeTreeView-copy'])
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize])
  const cb_moveNode = useCallback((_uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    addRunningActions(['nodeTreeView-move'])

    // validate
    const uids = getValidNodeUids(nodeTree, _uids, targetUid)

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = moveNode(tree, targetUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])

    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'move-node', param: [uids, targetUid, isBetween, res.position] })

    removeRunningActions(['nodeTreeView-move'])
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize])
  // -------------------------------------------------------------- node view state handlers --------------------------------------------------------------
  const cb_focusNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-focus'])

    // validate
    if (focusedItem === uid) {
      removeRunningActions(['nodeTreeView-focus'], false)
      return
    }

    dispatch(focusFNNode(uid))
    focusedItemRef.current = uid

    removeRunningActions(['nodeTreeView-focus'])
  }, [addRunningActions, removeRunningActions, focusedItem])
  const cb_selectNode = useCallback((uids: TNodeUid[]) => {
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
  }, [addRunningActions, removeRunningActions, validNodeTree, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-arrow'])

    dispatch(expandFNNode([uid]))

    removeRunningActions(['nodeTreeView-arrow'])
  }, [addRunningActions, removeRunningActions])
  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-arrow'])

    dispatch(collapseFNNode([uid]))

    removeRunningActions(['nodeTreeView-arrow'])
  }, [addRunningActions, removeRunningActions])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  useEffect(() => {
    if (activePanel !== 'node' && activePanel !== 'stage') return

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
    if (selectedItems.length === 0) return
    setClipboardData({ panel: 'node', type: 'cut', uids: selectedItems })
  }, [selectedItems])
  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return
    setClipboardData({ panel: 'node', type: 'copy', uids: selectedItems })
  }, [selectedItems])
  const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'node') return

    const uids = clipboardData.uids.filter(uid => !!validNodeTree[uid])
    const focusedNode = validNodeTree[focusedItem]
    const parentNode = validNodeTree[focusedNode.parentUid as TNodeUid]

    const childIndex = getNodeChildIndex(parentNode, focusedNode)

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'unknown', type: null, uids: [] })
      cb_moveNode(uids, parentNode.uid, true, childIndex + 1)
    } else {
      cb_copyNode(uids, parentNode.uid, true, childIndex + 1)
    }
  }, [clipboardData, validNodeTree, focusedItem, cb_moveNode, cb_copyNode])
  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_removeNode(selectedItems)
  }, [cb_removeNode, selectedItems])
  const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_duplicateNode(selectedItems)
  }, [cb_duplicateNode, selectedItems])

  const onTurnInto = useCallback(() => { }, [])
  const onGroup = useCallback(() => { }, [])
  const onUngroup = useCallback(() => { }, [])

  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith(AddNodeActionPrefix)) {
      const tagName = actionName.slice(AddNodeActionPrefix.length + 2, actionName.length - 1)
      cb_addNode(tagName)
    }
  }, [cb_addNode])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback(() => {
    setActivePanel('node')
  }, [])

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
          <TreeView
            width={'100%'}
            height={'auto'}

            info={{ id: 'node-tree-view' }}

            data={nodeTreeViewData}
            focusedItem={focusedItem}
            selectedItems={selectedItems}
            expandedItems={expandedItems}

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

                        props.context.isSelected && 'background-tertiary outline-none',
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

                        !props.context.isFocused && props.context.focusItem()

                        e.shiftKey ? props.context.selectUpTo() :
                          e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) :
                            (props.context.selectItem())

                        setActivePanel('node')
                      }}
                      onFocus={() => { }}
                      onMouseEnter={() => setFNHoveredItem(props.item.index as TNodeUid)}
                      onMouseLeave={() => setFNHoveredItem('' as TNodeUid)}
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
                          addRunningActions(['nodeTreeView-arrow'])
                          props.context.toggleExpandedState()
                        },
                      }}>down</SVGIconI> :
                      <SVGIconII {...{
                        "class": "icon-xs",
                        "onClick": (e: MouseEvent) => {
                          addRunningActions(['nodeTreeView-arrow'])
                          props.context.toggleExpandedState()
                        },
                      }}>right</SVGIconII>)
                    : <div className='icon-xs'></div>}
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
                const targetUid = (isBetween ? target.parentItem : target.targetItem) as TNodeUid
                const position = isBetween ? target.childIndex : 0

                cb_moveNode(uids, targetUid, isBetween, position)
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