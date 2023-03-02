import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useSelector } from 'react-redux';

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
  const _document = contentRef?.contentWindow?.document
  const htmlNode = _document?.documentElement
  const headNode = _document?.head
  const bodyNode = _document?.body

  const onMouseEnter = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    console.log('mouse enter', className)
  }, [])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    console.log('mouse leave', className)
  }, [])
  const onMouseDown = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    console.log('mouse down', className)
  }, [])
  const onMouseUp = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    console.log('mouse up', className)
  }, [])
  const onDblClick = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    console.log('dbl click', className)
  }, [])

  useEffect(() => {
    const onMouseEnterListener = (e: MouseEvent) => {
      onMouseEnter(e)
    }
    _document?.addEventListener('mouseenter', onMouseEnterListener)
    // htmlNode?.addEventListener('mouseenter', onMouseEnterListener)

    const onMouseLeaveListener = (e: MouseEvent) => {
      onMouseLeave(e)
    }
    htmlNode?.addEventListener('mouseleave', onMouseLeaveListener)

    const onMouseDownListener = (e: MouseEvent) => {
      onMouseDown(e)
    }
    htmlNode?.addEventListener('mousedown', onMouseDownListener)

    const onMouseUpListener = (e: MouseEvent) => {
      onMouseUp(e)
    }
    htmlNode?.addEventListener('mouseup', onMouseUpListener)

    const onDblClickListener = (e: MouseEvent) => {
      onDblClick(e)
    }
    htmlNode?.addEventListener('dblclick', onDblClickListener)

    return () => {
      htmlNode?.removeEventListener('mouseenter', onMouseEnterListener)
      htmlNode?.removeEventListener('mouseleave', onMouseLeaveListener)
      htmlNode?.removeEventListener('mousedown', onMouseDownListener)
      htmlNode?.removeEventListener('mouseup', onMouseUpListener)
      htmlNode?.removeEventListener('dblclick', onDblClickListener)
    }
  }, [htmlNode, _document])

  useEffect(() => {
    /* if (file.type === 'html') {
      const settings = props.info as THtmlSettings
      let pageHtml = ''
      if (settings.html) {
        const node = nodeTree[settings.html]
        const data = node.data as THtmlNodeData
        pageHtml = data.innerHtml
        for (const attrName in data.attribs) {
          const attrValue = data.attribs[attrName]
          htmlNode?.setAttribute(attrName, attrValue)
        }
      }
      if (settings.head) {
        const node = nodeTree[settings.head]
        const data = node.data as THtmlNodeData
        for (const attrName in data.attribs) {
          const attrValue = data.attribs[attrName]
          headNode?.setAttribute(attrName, attrValue)
        }
      }
      if (settings.body) {
        const node = nodeTree[settings.body]
        const data = node.data as THtmlNodeData
        for (const attrName in data.attribs) {
          const attrValue = data.attribs[attrName]
          bodyNode?.setAttribute(attrName, attrValue)
        }
      }
    } */
  }, [props.info])

  useEffect(() => {
    // htmlNode?.remove()
    // headNode?.remove()
    // bodyNode?.remove()
    console.log('file content changed - need to reset document', file.content)
    _document?.write(file.content)
  }, [file.content])

  return (
    <iframe
      ref={setContentRef}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  )
}