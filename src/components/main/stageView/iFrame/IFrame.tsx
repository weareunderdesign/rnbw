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
import { getValidNodeUids } from '@_node/apis';
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
  updateFNTreeViewState,
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
    iframeLoading, setIFrameLoading,

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
  // mark hovered item
  const fnHoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  useEffect(() => {
    if (fnHoveredItemRef.current === fnHoveredItem) return

    // remove cur hovered effect
    {
      // for the elements which are created by js. (ex: Web Component)
      let curHoveredElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItemRef.current}"]`)
      const isValid: null | string = curHoveredElement?.firstElementChild ? curHoveredElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
      isValid === null ? curHoveredElement = curHoveredElement?.firstElementChild : null
      curHoveredElement?.removeAttribute('rnbwdev-rnbw-element-hover')
    }

    // mark new hovered item
    {
      // for the elements which are created by js. (ex: Web Component)
      let newHoveredElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${fnHoveredItem}"]`)
      const isValid: null | string = newHoveredElement?.firstElementChild ? newHoveredElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
      isValid === null ? newHoveredElement = newHoveredElement?.firstElementChild : null
      newHoveredElement?.setAttribute('rnbwdev-rnbw-element-hover', '')
    }

    fnHoveredItemRef.current = fnHoveredItem
  }, [fnHoveredItem])
  // mark&scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const newFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
    setTimeout(() => newFocusedElement?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }), 0)

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // mark selected items
  const selectedItemsRef = useRef<TNodeUid[]>(selectedItems)
  useEffect(() => {
    if (selectedItemsRef.current.length === selectedItems.length) {
      let same = true
      for (let index = 0, len = selectedItemsRef.current.length; index < len; ++index) {
        if (selectedItemsRef.current[index] !== selectedItems[index])
          same = false
        break
      }
      if (same) return
    }

    // remove org selcted effect
    selectedItemsRef.current.map(uid => {
      // for the elements which are created by js. (ex: Web Component)
      let curselectedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const isValid: null | string = curselectedElement?.firstElementChild ? curselectedElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
      isValid === null ? curselectedElement = curselectedElement?.firstElementChild : null
      curselectedElement?.removeAttribute('rnbwdev-rnbw-element-select')
    })

    // mark new selected items
    selectedItems.map(uid => {
      // for the elements which are created by js. (ex: Web Component)
      let newSelectedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const isValid: null | string = newSelectedElement?.firstElementChild ? newSelectedElement?.firstElementChild.getAttribute(NodeInAppAttribName) : ''
      isValid === null ? newSelectedElement = newSelectedElement?.firstElementChild : null
      newSelectedElement?.setAttribute('rnbwdev-rnbw-element-select', '')
    })

    selectedItemsRef.current = [...selectedItems]
  }, [selectedItems])
  // set/select item
  const setFocusedSelectedItems = useCallback((uid: TNodeUid, _selectedItems?: TNodeUid[]) => {
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
    _selectedItems ? dispatch(selectFNNode(_selectedItems)) : dispatch(selectFNNode([uid]))

    focusedItemRef.current = uid

    removeRunningActions(['stageView-focus'])
  }, [addRunningActions, removeRunningActions, nodeTree])
  // -------------------------------------------------------------- side effect handlers --------------------------------------------------------------
  const addElement = useCallback((targetUid: TNodeUid, node: TNode) => {
    // build new element
    const nodeData = node.data as THtmlNodeData
    const newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
    newElement?.setAttribute(NodeInAppAttribName, node.uid)

    // add after target
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    newElement && targetElement?.parentElement?.insertBefore(newElement, targetElement.nextElementSibling)

    // view state
    dispatch(focusFNNode(node.uid))
    dispatch(selectFNNode([node.uid]))
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const removeElements = useCallback((uids: TNodeUid[], deletedUids: TNodeUid[]) => {
    uids.map((uid) => {
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      ele?.remove()
    })

    // view state
    dispatch(updateFNTreeViewState({ deletedUids }))
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const moveElements = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    const _elements: (Node | undefined)[] = []

    // remove from org parents
    const _uids = [...uids]
    _uids.reverse()
    _uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      _elements.push(ele?.cloneNode(true))
      ele?.remove()
    })

    // add to new target + position
    _elements.map((_ele) => {
      const refElement = isBetween ? contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${position + 1})`) : null
      _ele && targetElement?.insertBefore(_ele, refElement || null)
    })

    // view state
    dispatch(focusFNNode(uids[uids.length - 1]))
    dispatch(selectFNNode(uids))
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const copyElements = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number, addedUidMap: Map<TNodeUid, TNodeUid>) => {
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    const refElement = isBetween ? contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${position + 1})`) : null

    uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const _ele = ele?.cloneNode(true) as HTMLElement

      // reset nest's uid
      const newUid = addedUidMap.get(uid)
      newUid && _ele.setAttribute(NodeInAppAttribName, newUid)

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

    // view state
    const newUids = uids.map((uid) => addedUidMap.get(uid)).filter(uid => uid) as TNodeUid[]
    dispatch(focusFNNode(newUids[newUids.length - 1]))
    dispatch(selectFNNode(newUids))
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const duplicateElements = useCallback((uids: TNodeUid[], addedUidMap: Map<TNodeUid, TNodeUid>) => {
    uids.map((uid) => {
      // clone
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      const _ele = ele?.cloneNode(true) as HTMLElement

      // reset nest's uid
      const newUid = addedUidMap.get(uid)
      newUid && _ele.setAttribute(NodeInAppAttribName, newUid)

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
      ele?.parentElement?.insertBefore(_ele, ele.nextElementSibling)
    })

    // view state
    const newUids = uids.map((uid) => addedUidMap.get(uid)).filter(uid => uid) as TNodeUid[]
    dispatch(focusFNNode(newUids[newUids.length - 1]))
    dispatch(selectFNNode(newUids))
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  // -------------------------------------------------------------- iframe event handlers --------------------------------------------------------------
  // mouse events
  const onMouseEnter = useCallback((e: MouseEvent) => { }, [])
  const onMouseMove = useCallback((e: MouseEvent) => {
    const ele = e.target as HTMLElement
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    // for the elements which are created by js. (ex: Web Component)
    let newHoveredElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = newHoveredElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)
      !_uid ? newHoveredElement = parentEle : null
    }

    // set hovered item
    if (_uid && _uid !== fnHoveredItem) {
      setFNHoveredItem(_uid)
    }
  }, [fnHoveredItem])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    setFNHoveredItem('')
  }, [])
  const onMouseDown = useCallback((e: MouseEvent) => {
    const ele = e.target as HTMLElement
    let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    // for the elements which are created by js. (ex: Web Component)
    let newFocusedElement: HTMLElement = ele
    while (!_uid) {
      const parentEle = newFocusedElement.parentElement
      if (!parentEle) break

      _uid = parentEle.getAttribute(NodeInAppAttribName)
      !_uid ? newFocusedElement = parentEle : null
    }

    // set focused/selected items
    if (_uid) {
      if (getCommandKey(e, osType)) {
        let found = false
        const _selectedItems = selectedItemsRef.current.filter(uid => {
          uid === _uid ? found = true : null
          return uid !== _uid
        })
        !found ? _selectedItems.push(_uid) : null
        setFocusedSelectedItems(_uid, getValidNodeUids(nodeTree, _selectedItems))
      } else {
        if (_uid !== focusedItem) {
          setFocusedSelectedItems(_uid)
        }
      }
    }

    setActivePanel('stage')
  }, [osType, focusedItem, setFocusedSelectedItems, nodeTree])
  const onMouseUp = useCallback((e: MouseEvent) => { }, [])
  const onDblClick = useCallback((e: MouseEvent) => { }, [])
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

    // prevent chrome default short keys
    e.preventDefault()

    setCurrentCommand({ action })
  }, [cmdkReferenceData])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  // iframe event listeners
  const [iframeEvent, setIframeEvent] = useState<MouseEvent>()
  useEffect(() => {
    if (contentRef) {
      setIFrameLoading(true)

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
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mousemove', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mouseleave', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mousedown', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mouseup', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent(e)
          })
          htmlNode.addEventListener('dblclick', (e: MouseEvent) => {
            e.stopPropagation()
            setIframeEvent(e)
          })
        }

        setIFrameLoading(false)
      }
    }
  }, [contentRef])
  useEffect(() => {
    if (!iframeEvent) return

    const { type } = iframeEvent
    switch (type) {
      case 'mouseenter':
        onMouseEnter(iframeEvent)
        break
      case 'mousemove':
        onMouseMove(iframeEvent)
        break
      case 'mouseleave':
        onMouseLeave(iframeEvent)
        break
      case 'mousedown':
        onMouseDown(iframeEvent)
        break
      case 'mouseup':
        onMouseUp(iframeEvent)
        break
      case 'dblclick':
        onDblClick(iframeEvent)
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
          removeElements(...param as [TNodeUid[], TNodeUid[]])
          break
        case 'move-node':
          moveElements(...param as [TNodeUid[], TNodeUid, boolean, number])
          break
        case 'copy-node':
          copyElements(...param as [TNodeUid[], TNodeUid, boolean, number, Map<TNodeUid, TNodeUid>])
          break
        case 'duplicate-node':
          duplicateElements(...param as [TNodeUid[], Map<TNodeUid, TNodeUid>])
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