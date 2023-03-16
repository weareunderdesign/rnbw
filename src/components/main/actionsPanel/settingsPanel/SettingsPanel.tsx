import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import cx from 'classnames';
import { useDispatch } from 'react-redux';
import { Panel } from 'react-resizable-panels';

import { MainContext } from '@_redux/main';

import { SettingsPanelProps } from './types';

type StyleProperty = {
  name: string,
  value: string,
}

export default function SettingsPanel(props: SettingsPanelProps) {
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
  } = useContext(MainContext)

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('settings')
  }, [])

  // panel size handler
  const [panelSize, setPanelSize] = useState(200 / window.innerHeight * 100)
  useEffect(() => {
    const windowResizeHandler = () => {
      setPanelSize(200 / window.innerHeight * 100)
    }
    window.addEventListener('resize', windowResizeHandler)

    return () => window.removeEventListener('resize', windowResizeHandler)
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <Panel defaultSize={panelSize} minSize={0}>
      <div
        id="SettingsView"
        className={cx(
          'scrollable',
          // activePanel === 'settings' ? "outline outline-primary" : "",
        )}
        style={{
          pointerEvents: panelResizing ? 'none' : 'auto',
        }}
        onClick={onPanelClick}
      >
      </div>
    </Panel>
  </>
}