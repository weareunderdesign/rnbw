import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  NodeInAppAttribName,
  NodeUidSplitterRegExp,
  RootNodeUid,
} from '@_constants/main';
import { TNodeUid } from '@_node/types';
import {
  expandFNNode,
  fnSelector,
  focusFNNode,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from '@_redux/main';

import { StageViewContext } from './context';
import IFrame from './iFrame';
import { StageViewProps } from './types';

export default function StageView(props: StageViewProps) {
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
  // focusedItem -> scrollTo
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  const stageViewRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // skip its own state change
    if (focusedItemRef.current === focusedItem) return

    // validate
    if (stageViewRef.current === null) return
    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return

    // scrollTo
    const stageViewDoc = stageViewRef.current.querySelector('iframe')?.contentWindow?.document
    const selector = `[${NodeInAppAttribName}="${focusedItem}"]`
    const focusedComponent = stageViewDoc?.querySelector(selector)
    focusedComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [focusedItem])

  // select -> focusedItem
  const setFocusedItem = useCallback((uid: TNodeUid) => {
    // validate
    if (focusedItem === uid || validNodeTree[uid] === undefined) return

    addRunningActions(['stageView-click'])

    // expand the path to the uid
    const _expandedItems: TNodeUid[] = []
    let node = validNodeTree[uid]
    while (node.uid !== RootNodeUid) {
      _expandedItems.push(node.uid)
      node = validNodeTree[node.parentUid as TNodeUid]
    }
    _expandedItems.shift()
    dispatch(expandFNNode(_expandedItems))

    // focus
    focusedItemRef.current = uid
    dispatch(focusFNNode(uid))

    // select
    dispatch(selectFNNode([uid]))

    removeRunningActions(['stageView-click'])
  }, [focusedItem, validNodeTree])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('stage')
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------


  return <>
    <StageViewContext.Provider value={{ setFocusedItem }}>
      <Panel minSize={0}>
        <div
          id="StageView"
          className={cx(
            'scrollable',
            // activePanel === 'stage' ? "outline outline-primary" : "",
          )}
          style={{
            background: file.uid !== '' ? "white" : "",
            position: "relative",
            pointerEvents: panelResizing ? 'none' : 'auto',
          }}
          onClick={onPanelClick}
          ref={stageViewRef}
        >
          {false ? file.uid !== '' && <iframe src={`./fs/${file.uid.replace(NodeUidSplitterRegExp, '-')}`} style={{ width: '100%', height: '100%', position: 'absolute' }} /> : <IFrame />}
        </div>
      </Panel>
    </StageViewContext.Provider>
  </>
}