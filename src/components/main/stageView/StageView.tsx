import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  fnSelector,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';

import IFrame from './iFrame';
import { StageViewProps } from './types';

export default function StageView(props: StageViewProps) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree,

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

    // stage-view
    iframeSrc,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('stage')
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return useMemo(() => {
    return <>
      <Panel minSize={0}>
        <div
          id="StageView"
          className={cx(
            'scrollable',
          )}
          style={{
            background: iframeSrc ? "white" : "",
            position: "relative",
            pointerEvents: panelResizing ? 'none' : 'auto',
          }}
          onClick={onPanelClick}
        >
          {false && <IFrame />}
        </div>
      </Panel>
    </>
  }, [iframeSrc, panelResizing, onPanelClick])
}