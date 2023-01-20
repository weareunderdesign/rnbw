import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import ReactShadowRoot from 'react-shadow-root';

import { TUid } from '@_node/types';
import * as Main from '@_redux/main';

import { StageViewContext } from './context';
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
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,
  } = useContext(Main.MainContext)

  // redux state
  const { project, currentFile } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // focusedItem -> scrollTo
  const focusedItemRef = useRef<TUid>(focusedItem)
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
    const focusedComponent = stageViewRef.current.shadowRoot?.querySelector(`.rnbwdev-rainbow-component-${focusedItem.replace(/\?/g, '-')}`)
    setTimeout(() => focusedComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 0)
  }, [focusedItem])

  // select -> focusedItem
  const setFocusedItem = useCallback((uid: TUid) => {
    // focus NodeTreeView - item
    const focusedComponent = document.getElementById(`NodeTreeView-${uid}`)
    focusedComponent?.focus()

    // validate
    if (focusedItem === uid || validNodeTree[uid] === undefined) return

    addRunningActions(['stageView-click'])

    // expand the path to the uid
    const _expandedItems: TUid[] = []
    let node = validNodeTree[uid]
    while (node.uid !== 'ROOT') {
      _expandedItems.push(node.uid)
      node = validNodeTree[node.p_uid as TUid]
    }
    _expandedItems.shift()
    dispatch(Main.expandFNNode(_expandedItems))

    // focus
    focusedItemRef.current = uid
    dispatch(Main.focusFNNode(uid))

    // select
    dispatch(Main.selectFNNode([uid]))

    removeRunningActions(['stageView-click'])
  }, [focusedItem, validNodeTree])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    // e.preventDefault()

    setActivePanel('node')
  }, [])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // shadow root css
  const sheet: CSSStyleSheet = new CSSStyleSheet()
  sheet.replaceSync(styles)
  const styleSheets = [sheet]

  return <>
    <StageViewContext.Provider value={{ setFocusedItem }}>
      <div
        className="panel box padding-xs shadow border-left"
        onClick={onPanelClick}
      >
        <div
          ref={stageViewRef}
          className='box border-top border-right border-bottom border-left'
          style={{ maxHeight: "calc(100vh - 8px)", overflow: "auto" }}
        >
          <ReactShadowRoot stylesheets={styleSheets}>
            {<NodeRenderer id={'ROOT'}></NodeRenderer>}
          </ReactShadowRoot>
        </div>
      </div>
    </StageViewContext.Provider>
  </>
}