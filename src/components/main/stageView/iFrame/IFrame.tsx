import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import { TNodeUid } from '@_node/types';
import {
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import { TCmdkKeyMap } from '@_types/main';

import { styles } from './styles';
import { IFrameProps } from './types';

export const IFrame = (props: IFrameProps) => {
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
    fileInfo, setFileInfo,
    hasSameScript, setHasSameScript,
  } = useContext(MainContext)

  // redux state
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  const fnHoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)

  // sync from redux
  useEffect(() => {
    // validate 
    const node = validNodeTree[focusedItem]
    if (node === undefined) return

    // skip its own change
    if (focusedItemRef.current === focusedItem) return

    focusedElement?.removeAttribute('rnbwdev-rnbw-component-focus')

    let newComponent = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
    const isValid: null | string = newComponent?.firstElementChild ? newComponent?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
    isValid === null ? newComponent = newComponent?.firstElementChild : null

    newComponent?.setAttribute('rnbwdev-rnbw-component-focus', '')
    newComponent?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })

    setFocusedElement(!newComponent ? null : newComponent as HTMLElement)
    focusedItemRef.current = focusedItem
  }, [focusedItem])
  useEffect(() => {
    // validate 
    const node = validNodeTree[focusedItem]
    if (node === undefined) return

    // skip its own change
    if (fnHoveredItemRef.current === fnHoveredItem) return

    hoveredElement?.removeAttribute('rnbwdev-rnbw-component-hover')

    let newComponent = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItem}"]`)
    const isValid: null | string = newComponent?.firstElementChild ? newComponent?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
    isValid === null ? newComponent = newComponent?.firstElementChild : null

    newComponent?.setAttribute('rnbwdev-rnbw-component-hover', '')

    setHoveredElement(!newComponent ? null : newComponent as HTMLElement)
    fnHoveredItemRef.current = fnHoveredItem
  }, [fnHoveredItem])

  // sync to redux
  const setFocusedItem = useCallback((uid: TNodeUid) => {
    // validate
    if (focusedItem === uid || validNodeTree[uid] === undefined) return

    addRunningActions(['stageView-focus'])

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

    removeRunningActions(['stageView-focus'])
  }, [focusedItem, validNodeTree])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Handlers --------------------------------------------------------------
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  // iframe render flag
  useEffect(() => {
    if (!fileInfo) return

    !hasSameScript && setHasSameScript(true)
  }, [hasSameScript])

  // event handlers
  const onMouseEnter = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
  }, [])
  const onMouseMove = useCallback((ele: HTMLElement) => {
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)

    // validate element which is added by javascript - such as web component
    let validElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = validElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)

      !_uid ? validElement = parentEle : null
    }

    // markup hovered item
    if (_uid && _uid !== fnHoveredItem) {
      hoveredElement?.removeAttribute('rnbwdev-rnbw-component-hover')
      validElement.setAttribute('rnbwdev-rnbw-component-hover', '')
      setHoveredElement(validElement)

      setFNHoveredItem(_uid)
      fnHoveredItemRef.current = _uid
    }
  }, [fnHoveredItem, hoveredElement])
  const onMouseLeave = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
  }, [])

  const onMouseDown = useCallback((ele: HTMLElement) => {
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)

    // validate element which is added by javascript - such as web component
    let validElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = validElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)

      !_uid ? validElement = parentEle : null
    }

    // markup focused item
    if (_uid && _uid !== focusedItem) {
      focusedElement?.removeAttribute('rnbwdev-rnbw-component-focus')
      validElement.setAttribute('rnbwdev-rnbw-component-focus', '')
      setFocusedElement(validElement)

      setFocusedItem(_uid)
    }
  }, [focusedItem, focusedElement, setFocusedItem])
  const onMouseUp = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
  }, [])

  const onDblClick = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
  }, [])

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

    console.log('action to be run by cmdk: ', action)
    setCurrentCommand({ action })
  }, [cmdkReferenceData])

  // handle iframe events
  const [iframeEvent, setIframeEvent] = useState<{ type: string, ele: HTMLElement }>()
  useEffect(() => {
    if (!iframeEvent) return

    const { type, ele } = iframeEvent

    switch (type) {
      case 'onMouseEnter':
        onMouseEnter(ele)
        break
      case 'mousemove':
        onMouseMove(ele)
        break
      case 'mouseleave':
        onMouseLeave(ele)
        break

      case 'mousedown':
        onMouseDown(ele)
        break
      case 'mouseup':
        onMouseUp(ele)
        break

      case 'dblclick':
        onDblClick(ele)
        break
      default:
        break
    }
  }, [iframeEvent])

  // init
  useEffect(() => {
    if (contentRef) {
      setPending(true)

      contentRef.onload = () => {
        const _document = contentRef?.contentWindow?.document
        const htmlNode = _document?.documentElement
        const headNode = _document?.head

        if (htmlNode && headNode) {
          // enable cmdk
          htmlNode.addEventListener('keydown', keyDownListener)

          // add rnbw css
          const style = _document.createElement('style')
          style.textContent = styles
          headNode.appendChild(style)

          // define event handlers
          htmlNode.addEventListener('mouseenter', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })
          htmlNode.addEventListener('mousemove', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })
          htmlNode.addEventListener('mouseleave', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })

          htmlNode.addEventListener('mousedown', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })
          htmlNode.addEventListener('mouseup', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })

          htmlNode.addEventListener('dblclick', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent({ type: e.type, ele: e.target as HTMLElement })
          })
        }

        setPending(false)
      }
    }
  }, [contentRef])
  // -------------------------------------------------------------- Handlers --------------------------------------------------------------

  return useMemo(() => {
    return <>
      {iframeSrc && <iframe
        ref={setContentRef}
        src={iframeSrc}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />}
    </>
  }, [iframeSrc])
}