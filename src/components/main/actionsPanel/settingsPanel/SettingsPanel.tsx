import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useDispatch } from 'react-redux';

import { MainContext } from '@_redux/main';

import { SettingsPanelProps } from './types';

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const {
    // global action
    addRunningActions, removeRunningActions,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // file tree view
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
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('settings')
  }, [])

  return useMemo(() => {
    return <>
      <div
        id="SettingsPanel"
        className={'scrollable'}
        onClick={onPanelClick}
      >
      </div>
    </>
  }, [onPanelClick])
}