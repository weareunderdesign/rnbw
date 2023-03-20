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
  LogAllow,
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import { THtmlNodeData } from '@_node/html';
import {
  TNode,
  TNodeUid,
} from '@_node/types';
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

    // event
    event, setEvent,

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

  // -------------------------------------------------------------- sync --------------------------------------------------------------
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)
  // mark&scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const curFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItemRef.current}"]`)
    curFocusedElement?.removeAttribute('rnbwdev-rnbw-element-focus')
    // for the elements which are created by js. (ex: Web Component)
    let newFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
    const isValid: null | string = newFocusedElement?.firstElementChild ? newFocusedElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
    isValid === null ? newFocusedElement = newFocusedElement?.firstElementChild : null
    newFocusedElement?.setAttribute('rnbwdev-rnbw-element-focus', '')
    newFocusedElement?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // mark hovered item
  const fnHoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  useEffect(() => {
    if (fnHoveredItemRef.current === fnHoveredItem) return

    const curHoveredElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItemRef.current}"]`)
    curHoveredElement?.removeAttribute('rnbwdev-rnbw-element-hover')
    // for the elements which are created by js. (ex: Web Component)
    let newHoveredElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItem}"]`)
    const isValid: null | string = newHoveredElement?.firstElementChild ? newHoveredElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
    isValid === null ? newHoveredElement = newHoveredElement?.firstElementChild : null
    newHoveredElement?.setAttribute('rnbwdev-rnbw-element-hover', '')

    fnHoveredItemRef.current = fnHoveredItem
  }, [fnHoveredItem])
  // set focused item
  const setFocusedItem = useCallback((uid: TNodeUid) => {
    addRunningActions(['stageView-focus'])

    // expand path to the uid
    const _expandedItems: TNodeUid[] = []
    let node = nodeTree[uid]
    while (node.uid !== RootNodeUid) {
      _expandedItems.push(node.uid)
      node = nodeTree[node.parentUid as TNodeUid]
    }
    _expandedItems.shift()
    dispatch(expandFNNode(_expandedItems))

    dispatch(focusFNNode(uid))
    dispatch(selectFNNode([uid]))

    removeRunningActions(['stageView-focus'])
  }, [nodeTree])
  // -------------------------------------------------------------- side effect handlers --------------------------------------------------------------
  const addElement = useCallback((targetUid: TNodeUid, node: TNode) => {
    // build new element
    const nodeData = node.data as THtmlNodeData
    const newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
    newElement?.setAttribute(NodeInAppAttribName, node.uid)

    // add after target
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    newElement && targetElement?.parentElement?.insertBefore(newElement, targetElement.nextElementSibling)
  }, [contentRef])
  const removeElements = useCallback((uids: TNodeUid[]) => {
    uids.map((uid) => {
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      ele?.remove()
    })
  }, [contentRef])
  const moveElements = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    const refElement = isBetween ? contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${position + 1})`) : null

    uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const _ele = ele?.cloneNode(true)

      // update
      ele?.remove()
      _ele && targetElement?.insertBefore(_ele, refElement || null)
    })
  }, [contentRef])
  const copyElements = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number, addedUidMap: Map<string, string>) => {
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    const refElement = isBetween ? contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${position + 1})`) : null

    uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const _ele = ele?.cloneNode(true) as HTMLElement

      // reset nest's uid
      const _uid = _ele.getAttribute(NodeInAppAttribName)
      if (_uid) {
        const _newUid = addedUidMap.get(_uid)
        if (_newUid) {
          _ele.setAttribute(NodeInAppAttribName, _newUid)
        }
      }

      // reset descendant uids
      const childElementList = _ele.querySelectorAll('*')
      childElementList.forEach(childElement => {
        const childUid = childElement.getAttribute(NodeInAppAttribName)
        if (childUid) {
          const newChildUid = addedUidMap.get(childUid)
          if (newChildUid) {
            childElement.setAttribute(NodeInAppAttribName, newChildUid)
          }
        }
      })

      // update
      targetElement?.insertBefore(_ele, refElement || null)
    })
  }, [contentRef])
  const duplicateElements = useCallback((uids: TNodeUid[], addedUidMap: Map<string, string>) => {
    uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const _ele = ele?.cloneNode(true) as HTMLElement

      // reset nest's uid
      const _uid = _ele.getAttribute(NodeInAppAttribName)
      if (_uid) {
        const _newUid = addedUidMap.get(_uid)
        if (_newUid) {
          _ele.setAttribute(NodeInAppAttribName, _newUid)
        }
      }

      // reset descendant uids
      const childElementList = _ele.querySelectorAll('*')
      childElementList.forEach(childElement => {
        const childUid = childElement.getAttribute(NodeInAppAttribName)
        if (childUid) {
          const newChildUid = addedUidMap.get(childUid)
          if (newChildUid) {
            childElement.setAttribute(NodeInAppAttribName, newChildUid)
          }
        }
      })

      // update
      _ele.parentElement?.insertBefore(_ele, _ele.nextElementSibling)
    })
  }, [contentRef])
  // -------------------------------------------------------------- iframe event handlers --------------------------------------------------------------
  // mouse events
  const onMouseEnter = useCallback((ele: HTMLElement) => { }, [])
  const onMouseMove = useCallback((ele: HTMLElement) => {
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    // for the elements which are created by js. (ex: Web Component)
    let newHoveredElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = newHoveredElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)
      !_uid ? newHoveredElement = parentEle : null
    }

    // mark hovered item
    if (_uid && _uid !== fnHoveredItem) {
      const curHoveredElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItemRef.current}"]`)
      curHoveredElement?.removeAttribute('rnbwdev-rnbw-element-hover')
      newHoveredElement.setAttribute('rnbwdev-rnbw-element-hover', '')

      setFNHoveredItem(_uid)
      fnHoveredItemRef.current = _uid
    }
  }, [fnHoveredItem])
  const onMouseLeave = useCallback((ele: HTMLElement) => { }, [])
  const onMouseDown = useCallback((ele: HTMLElement) => {
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    // for the elements which are created by js. (ex: Web Component)
    let newFocusedElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = newFocusedElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)
      !_uid ? newFocusedElement = parentEle : null
    }

    // mark focused item
    if (_uid && _uid !== focusedItem) {
      const curFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItemRef.current}"]`)
      curFocusedElement?.removeAttribute('rnbwdev-rnbw-element-focus')
      newFocusedElement.setAttribute('rnbwdev-rnbw-element-focus', '')

      setFocusedItem(_uid)
      focusedItemRef.current = _uid
    }
  }, [focusedItem, setFocusedItem])
  const onMouseUp = useCallback((ele: HTMLElement) => { }, [])
  const onDblClick = useCallback((ele: HTMLElement) => { }, [])
  // key events
  const onKeyDown = useCallback((e: KeyboardEvent) => {
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
  // -------------------------------------------------------------- own --------------------------------------------------------------
  // iframe event listeners
  const [iframeEvent, setIframeEvent] = useState<{ type: string, ele: HTMLElement }>()
  useEffect(() => {
    if (contentRef) {
      setPending(true)

      contentRef.onload = () => {
        const _document = contentRef?.contentWindow?.document
        const htmlNode = _document?.documentElement
        const headNode = _document?.head

        if (htmlNode && headNode) {
          // enable cmdk
          htmlNode.addEventListener('keydown', onKeyDown)

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
  useEffect(() => {
    if (!iframeEvent) return

    const { type, ele } = iframeEvent
    switch (type) {
      case 'mouseenter':
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
  // node actions - side effect
  useEffect(() => {
    if (event) {
      const { type, param } = event
      switch (type) {
        case 'add-node':
          addElement(...param as [TNodeUid, TNode])
          break
        case 'remove-node':
          removeElements(...param as [TNodeUid[]])
          break
        case 'move-node':
          moveElements(...param as [TNodeUid[], TNodeUid, boolean, number])
          break
        case 'copy-node':
          copyElements(...param as [TNodeUid[], TNodeUid, boolean, number, Map<string, string>])
          break
        case 'duplicate-node':
          duplicateElements(...param as [TNodeUid[], Map<string, string>])
          break
        default:
          break
      }
    }
  }, [event])
  // reload when script changes
  useEffect(() => {
    !hasSameScript && setHasSameScript(true)
  }, [hasSameScript])

  return useMemo(() => {
    return <>
      {iframeSrc && hasSameScript &&
        <iframe
          ref={setContentRef}
          src={iframeSrc}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />}
    </>
  }, [iframeSrc, hasSameScript])
}