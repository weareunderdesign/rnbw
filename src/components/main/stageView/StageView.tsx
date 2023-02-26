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
import ReactShadowRoot from 'react-shadow-root';

import {
  NodeInAppClassName,
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
import NodeRenderer from './nodeRenderer';
import { styles } from './styles';
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
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file, changedFiles } = useSelector(navigatorSelector)
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
    if (focusedItemRef.current === focusedItem) {
      focusedItemRef.current = ''
      return
    }

    // validate
    if (stageViewRef.current === null) return
    const focusedNode = validNodeTree[focusedItem]
    if (focusedNode === undefined) return

    // scrollTo
    const focusedComponent = stageViewRef.current.shadowRoot?.querySelector(`.${NodeInAppClassName}-${focusedItem.replace(NodeUidSplitterRegExp, '-')}`)
    setTimeout(() => focusedComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 0)
  }, [focusedItem])

  // select -> focusedItem
  const setFocusedItem = useCallback((uid: TNodeUid) => {
    // focus NodeTreeView - item
    const focusedComponent = document.getElementById(`NodeTreeView-${uid}`)
    focusedComponent?.focus()

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

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('stage')
  }, [])

  // shadow root css
  const sheet: CSSStyleSheet = new CSSStyleSheet()
  sheet.replaceSync(styles)
  const styleSheets = [sheet]
  // -------------------------------------------------------------- other --------------------------------------------------------------


  return <>
    <StageViewContext.Provider value={{ setFocusedItem }}>
      <Panel>
        <div
          id="StageView"
          className={cx(
            'scrollable',
            // activePanel === 'stage' ? "outline outline-primary" : "",
          )}
          style={{ position: "relative" }}
          onClick={onPanelClick}
          ref={stageViewRef}
        >
          {true ? <>
            <ReactShadowRoot stylesheets={styleSheets}>
              <NodeRenderer id={RootNodeUid}></NodeRenderer>
            </ReactShadowRoot>
          </> : <>
            <IFrame>
              {<NodeRenderer id={RootNodeUid}></NodeRenderer>}
            </IFrame>
          </>}
        </div>
      </Panel>
    </StageViewContext.Provider>
  </>
}