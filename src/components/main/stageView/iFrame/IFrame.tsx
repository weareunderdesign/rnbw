import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useSelector } from 'react-redux';

import {
  LogAllow,
  NodeInAppAttribName,
} from '@_constants/main';
import {
  MainContext,
  navigatorSelector,
} from '@_redux/main';

import { IFrameProps } from './types';

export const IFrame = (props: IFrameProps) => {
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
  const { workspace, project, file } = useSelector(navigatorSelector)

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const onMouseEnter = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse enter', className)
  }, [])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse leave', className)
  }, [])
  const onMouseDown = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('mouse down', uid)
  }, [])
  const onMouseUp = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse up', className)
  }, [])
  const onDblClick = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('dbl click', className)
  }, [])

  useEffect(() => {
    if (file.uid !== '' && file.inAppContent !== '') {
      LogAllow && console.log('page content changed')
    } else {
      return
    }

    let loadListener: () => void
    contentRef?.addEventListener('load', loadListener = () => {
      const htmlNode = contentRef.contentWindow?.document.documentElement
      const fullContent = htmlNode?.outerHTML
      const bodyNode = contentRef.contentWindow?.document.body
      const elements = bodyNode?.querySelectorAll('*')
      LogAllow && console.log('loaded html elements except web componenets')
      elements?.forEach((ele) => {
        (ele as HTMLElement).addEventListener('mousedown', (e: MouseEvent) => {
          e.stopPropagation()
          onMouseDown(ele as HTMLElement)
        })
      })
    })

    return () => {
      contentRef?.removeEventListener('load', loadListener)
    }
  }, [file.inAppContent])

  return (
    <iframe
      ref={setContentRef}
      srcDoc={file.inAppContent}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  )
}