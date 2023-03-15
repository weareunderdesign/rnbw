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
  NodeUidSplitterRegExp,
  RootNodeUid,
} from '@_constants/main';
import {
  fnSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import { TCmdkKeyMap } from '@_types/main';

import { StageViewContext } from '../context';
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

    // stage-view
    fileInfo, setFileInfo,
    hasSameScript, setHasSameScript,
  } = useContext(MainContext)

  // redux state
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // stage view context
  const { setFocusedItem } = useContext(StageViewContext)

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const _document = contentRef?.contentWindow?.document
  const htmlNode = _document?.documentElement
  const headNode = _document?.head
  const bodyNode = _document?.body

  // enable cmdk on stage view
  const keyDownListener = useCallback((e: KeyboardEvent) => {
    // cmdk obj for the current command
    const cmdk: TCmdkKeyMap = {
      cmd: getCommandKey(e, osType),
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.code,
      click: false,
    }

    // detect action
    let action: string | null = null
    for (const actionName in cmdkReferenceData) {
      const _cmdk = cmdkReferenceData[actionName]['Keyboard Shortcut'] as TCmdkKeyMap

      const key = _cmdk.key.length === 0 ? '' : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }
    if (action === null) return

    LogAllow && console.log('action to be run by cmdk: ', action)
    setCurrentCommand({ action })
  }, [cmdkReferenceData])
  useEffect(() => {
    htmlNode?.addEventListener('keydown', keyDownListener)

    return () => htmlNode?.removeEventListener('keydown', keyDownListener)
  }, [htmlNode, cmdkReferenceData])

  // iframe render flag
  useEffect(() => {
    if (!fileInfo) return

    !hasSameScript && setHasSameScript(true)
  }, [hasSameScript])

  // event handlers
  const onMouseEnter = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('onMouseEnter', uid)
  }, [])
  const onMouseMove = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)

    const _document = contentRef?.contentWindow?.document
    const htmlNode = _document?.documentElement

    if (uid && fnHoveredItem !== uid) {
      LogAllow && console.log('onMouseMove', uid, fnHoveredItem)
      if (fnHoveredItem !== RootNodeUid) {
        const hoveredComponent = htmlNode?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItem}"]`)
        hoveredComponent?.removeAttribute('rnbwdev-rnbw-component-hover')
      }
      const newComponent = htmlNode?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      newComponent?.setAttribute('rnbwdev-rnbw-component-hover', '')
      setFNHoveredItem(uid)
    }
  }, [fnHoveredItem, contentRef])
  const onMouseLeave = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('onMouseLeave', uid)
  }, [])

  const onMouseDown = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)

    const _document = contentRef?.contentWindow?.document
    const htmlNode = _document?.documentElement

    if (uid && focusedItem !== uid) {
      LogAllow && console.log('onMouseDown', uid, focusedItem)
      if (focusedItem !== RootNodeUid) {
        const focusedComponent = htmlNode?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
        console.log(focusedComponent)
        focusedComponent?.removeAttribute('rnbwdev-rnbw-component-focus')
      }
      const newComponent = htmlNode?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      newComponent?.setAttribute('rnbwdev-rnbw-component-focus', '')
      setFocusedItem(uid)
    }
  }, [focusedItem, contentRef])
  const onMouseUp = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('onMouseUp', uid)
  }, [])

  const onDblClick = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('onDblClick', uid)
  }, [])

  useEffect(() => {
    let onMouseEnterListener: (e: MouseEvent) => void,
      onMouseMoveListener: (e: MouseEvent) => void,
      onMouseLeaveListener: (e: MouseEvent) => void,
      onMouseDownListener: (e: MouseEvent) => void,
      onMouseUpListener: (e: MouseEvent) => void,
      onDblClickListener: (e: MouseEvent) => void

    htmlNode?.addEventListener('mouseenter', onMouseEnterListener = (e: MouseEvent) => {
      e.stopPropagation()
      onMouseEnter(e.target as HTMLElement)
    })
    htmlNode?.addEventListener('mousemove', onMouseMoveListener = (e: MouseEvent) => {
      e.stopPropagation()
      onMouseMove(e.target as HTMLElement)
    })
    htmlNode?.addEventListener('mouseleave', onMouseLeaveListener = (e: MouseEvent) => {
      e.stopPropagation()
      onMouseLeave(e.target as HTMLElement)
    })

    htmlNode?.addEventListener('mousedown', onMouseDownListener = (e: MouseEvent) => {
      e.stopPropagation()
      onMouseDown(e.target as HTMLElement)
    })
    htmlNode?.addEventListener('mouseup', onMouseUpListener = (e: MouseEvent) => {
      e.stopPropagation()
      onMouseUp(e.target as HTMLElement)
    })

    htmlNode?.addEventListener('dblclick', onDblClickListener = (e: MouseEvent) => {
      e.stopPropagation()
      onDblClick(e.target as HTMLElement)
    })

    return () => {
      htmlNode?.removeEventListener('mouseenter', onMouseEnterListener)
      htmlNode?.removeEventListener('mousemove', onMouseMoveListener)
      htmlNode?.removeEventListener('mouseleave', onMouseLeaveListener)

      htmlNode?.removeEventListener('mousedown', onMouseDownListener)
      htmlNode?.removeEventListener('mouseup', onMouseUpListener)

      htmlNode?.removeEventListener('dblclick', onDblClickListener)
    }
  }, [htmlNode, onMouseEnter, onMouseMove, onMouseLeave, onMouseDown, onMouseUp, onDblClick])

  useEffect(() => {
    if (contentRef) {
      contentRef.onload = () => {
        setPending(false)
      }

      /* if (fileInfo && _document && htmlNode && headNode && bodyNode) {
        const settings = fileInfo as THtmlSettings

        // add css & js to iframe
        const style = _document.createElement('style')
        style.textContent = styles
        headNode.appendChild(style)

        settings.scripts.map(script => {
          const scriptTag = _document.createElement('script')
          const attribs = script.data.attribs
          Object.keys(attribs).map(attrName => {
            scriptTag.setAttribute(attrName, attribs[attrName])
          })
          if (settings.head && script.uid.startsWith(settings.head)) {
            headNode.appendChild(scriptTag)
          } else {
            bodyNode.appendChild(scriptTag)
          }
        })

        // html
        htmlNode.getAttributeNames().map(attrName => {
          htmlNode.removeAttribute(attrName)
        })
        if (settings.html) {
          const node = nodeTree[settings.html]
          const data = node.data as THtmlNodeData
          for (const attrName in data.attribs) {
            const attrValue = data.attribs[attrName]
            htmlNode.setAttribute(attrName, attrValue)
          }
        }

        // head
        headNode.getAttributeNames().map(attrName => {
          headNode.removeAttribute(attrName)
        })
        if (settings.head) {
          const { attribs } = nodeTree[settings.head].data as THtmlNodeData
          Object.keys(attribs).map(attrName => {
            headNode.setAttribute(attrName, attribs[attrName])
          })
        }

        // body
        bodyNode.getAttributeNames().map(attrName => {
          bodyNode.removeAttribute(attrName)
        })
        if (settings.body) {
          const { attribs } = nodeTree[settings.body].data as THtmlNodeData
          Object.keys(attribs).map(attrName => {
            bodyNode.setAttribute(attrName, attribs[attrName])
          })
        }

        setPending(true)
      } */
    }
  }, [contentRef])

  return <>
    {hasSameScript && file.uid !== '' && <>
      <iframe
        ref={setContentRef}
        src={`./fs/${file.uid.replace(NodeUidSplitterRegExp, '-')}`}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        {/* {file.info && headNode && createPortal(<NodeRenderer id={file.info.head || ''} />, headNode)}
        {file.info && bodyNode && createPortal(<NodeRenderer id={file.info.body || ''} />, bodyNode)} */}
      </iframe>
    </>}
  </>
}