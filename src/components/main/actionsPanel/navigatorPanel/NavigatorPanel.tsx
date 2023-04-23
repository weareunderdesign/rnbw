import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';

import { NavigatorPanelProps } from './types';

export default function NavigatorPanel(props: NavigatorPanelProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // navigator
    workspace,
    project,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen, setInitialFileToOpen,
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    linkToOpen, setLinkToOpen,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage, removeMessage,
  } = useContext(MainContext)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  useEffect(() => {
    console.log({ workspace, project, ffTree, file })
  }, [workspace, project, ffTree, file])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  return useMemo(() => {
    return <>
      <div
        id="NavigatorPanel"
        style={{
          overflow: 'auto',
          ...(showActionsPanel ? {} : { width: '0' }),
        }}
        onClick={onPanelClick}>
        <div className='justify-stretch padding-s border-bottom'>
          <div className="gap-s align-center">
            <div className="radius-m icon-s align-center background-secondary"></div>
            <span className="text-s opacity-m">/</span>
            <div className="gap-s align-center radius-s">
              <div className="radius-m icon-s align-center background-secondary"></div>
              <span className="text-s">Project</span>
            </div>
          </div>
        </div>
      </div>
    </>
  }, [
    onPanelClick, showActionsPanel,
  ])
}