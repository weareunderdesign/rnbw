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
  selectFNNode,
  updateFNTreeViewState,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import { TCmdkKeyMap } from '@_types/main';

import { styles } from './styles';
import { IFrameProps } from './types';

// const fallback img, audio, video images 
const defaultImage = "https://user-images.githubusercontent.com/13418616/234660226-dc0cb352-3735-478c-bcc0-d47f73eb3e31.svg"
const defaultAudio = "https://user-images.githubusercontent.com/13418616/234660225-7195abb2-91e7-402f-aa7d-902bbf7d66f8.svg"
const defaultVideo = "https://user-images.githubusercontent.com/13418616/234660227-aeb91595-1ed6-4b46-8197-c6feb7af3718.svg"

export const IFrame = (props: IFrameProps) => {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)
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
    linkToOpen, setLinkToOpen,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    setCodeViewOffsetTop,
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
    parseFileFlag,
    // close all panel
    closeAllPanel
  } = useContext(MainContext)
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
    const elementRect = (newFocusedElement as HTMLElement)?.getBoundingClientRect()
    setTimeout(() => newFocusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' }), 50)
    if (elementRect) {
      if (elementRect.y < 0) {
        setCodeViewOffsetTop('66')
      }
      else {
        const innerHeight = contentRef?.contentWindow?.document.documentElement.clientHeight
        const elePosition = elementRect.y + elementRect.height / 2
        if (innerHeight) {
          if (elementRect.height < innerHeight / 2) {
            if (elePosition / innerHeight * 100 > 66) {
              setCodeViewOffsetTop('1')
            }
            if (elePosition / innerHeight * 100 < 33) {
              setCodeViewOffsetTop('66')
            }
          }
        }
      }
    }
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
  const addElement = useCallback((targetUid: TNodeUid, node: TNode, contentNode: TNode | null) => {
    // build new element
    const nodeData = node.data as THtmlNodeData
    const newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
    for (const attrName in nodeData.attribs) {
      newElement?.setAttribute(attrName, nodeData.attribs[attrName])
    }
    if (contentNode && newElement) {
      const contentNodeData = contentNode.data as THtmlNodeData
      newElement.innerHTML = contentNodeData.data
    }
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
  const onClick = useCallback((e: MouseEvent) => {
    const ele = e.target as HTMLElement

    // handle links
    let isLinkTag = false
    let linkElement = ele
    while (true) {
      if (linkElement.tagName === 'A') {
        isLinkTag = true
        break
      }
      const parentEle = linkElement.parentElement
      if (!parentEle) break

      linkElement = parentEle
    }
    if (isLinkTag) {
      const uid: TNodeUid | null = linkElement.getAttribute(NodeInAppAttribName)
      if (uid !== null) {
        if (uid === linkTagUid.current) {
          const href = linkElement.getAttribute('href')
          href && setLinkToOpen(href)
          linkTagUid.current = ''
        } else {
          linkTagUid.current = uid
        }
      }
    } else {
      linkTagUid.current = ''
    }

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
      if (e.shiftKey) {
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

  // text editing
  const contentEditableUidRef = useRef('')
  const [contentEditableAttr, setContentEditableAttr] = useState<string | null>(null)
  const [outerHtml, setOuterHtml] = useState('')
  useEffect(() => {
    const node = validNodeTree[contentEditableUidRef.current]
    if (!node) return
    const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`)
    if (!ele) return

    contentEditableUidRef.current = ''

    contentEditableAttr ? ele.setAttribute('contenteditable', contentEditableAttr) : ele.removeAttribute('contenteditable')
    const cleanedUpCode = ele.outerHTML.replace(/rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g, '')
    onTextEdit(node, cleanedUpCode)
  }, [focusedItem])
  const onTextEdit = useCallback((node: TNode, _outerHtml: string) => {
    // replace enter to br
    while(true){
      _outerHtml = _outerHtml.replace('<div><br></div>', '<br>')
      if (_outerHtml.search('<div><br></div>') === -1)
        break
    }
    if (outerHtml === _outerHtml) return

    setCodeChanges([{ uid: node.uid, content: _outerHtml }])
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: true, from: 'stage' })
  }, [outerHtml])
  const onCmdEnter = useCallback((e: KeyboardEvent) => {
    // cmdk obj for the current command
    const cmdk: TCmdkKeyMap = {
      cmd: getCommandKey(e, osType),
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.code,
      click: false,
    }
    
    if (e.key === 'Escape') {
      closeAllPanel()
      return
    }

    if (cmdk.cmd && cmdk.key === 'Enter'){
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`)
      if (!ele) return
      (ele as HTMLElement).blur();
      setFocusedSelectedItems(focusedItem)
    }
  }, [focusedItem, validNodeTree, contentRef])
  const onDblClick = useCallback((e: MouseEvent) => {
    const ele = e.target as HTMLElement
    let uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    if (uid) {
      const node = validNodeTree[uid]
      if (!node) return
      const nodeData = node.data as THtmlNodeData
      if (nodeData.name === 'html' || nodeData.name === 'head' || nodeData.name === 'body') return

      const cleanedUpCode = ele.outerHTML.replace(/rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g, '')
      setOuterHtml(cleanedUpCode)
      if (ele.hasAttribute('contenteditable')) {
        setContentEditableAttr(ele.getAttribute('contenteditable'))
      }
      ele.setAttribute('contenteditable', 'true')
      contentEditableUidRef.current = uid
    }
  }, [validNodeTree])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (contentEditableUidRef.current !== '') return

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

      const key = _cmdk.key.length === 0 ? ''
        : _cmdk.key === '\\' ? 'Backslash'
          : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }
    if (action === null) return

    LogAllow && console.log('action to be run by cmdk: ', action)

    // prevent chrome default short keys
    if (action === 'Save' || action === 'Download' || action === 'Duplicate') {
      e.preventDefault()
    }

    setCurrentCommand({ action })
  }, [cmdkReferenceData])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const linkTagUid = useRef<TNodeUid>('')

  // iframe event listeners
  const [iframeEvent, setIframeEvent] = useState<MouseEvent>()

  // iframe skeleton
  const Skeleton = () => {
    return <div>Cool loading screen</div>;
  };
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
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mousemove', (e: MouseEvent) => {
            setIframeEvent(e)
          })
          htmlNode.addEventListener('mouseleave', (e: MouseEvent) => {
            setIframeEvent(e)
          })
          htmlNode.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault()
            setIframeEvent(e)
          })
          htmlNode.addEventListener('dblclick', (e: MouseEvent) => {
            setIframeEvent(e)
          })
          htmlNode.addEventListener('keydown', (e: KeyboardEvent) => {
            onCmdEnter(e)
          })
          _document.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault()
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
      case 'click':
        onClick(iframeEvent)
        break
      case 'dblclick':
        onDblClick(iframeEvent)
        break
      default:
        break
    }
  }, [iframeEvent])
  // node actions, code change - side effect
  useEffect(() => {
    if (event) {
      const { type, param } = event
      switch (type) {
        case 'add-node':
          addElement(...param as [TNodeUid, TNode, TNode | null])
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
    if (needToReloadIFrame) {
      setNeedToReloadIFrame(false)
      linkTagUid.current = ''
    }
  }, [needToReloadIFrame])

  return useMemo(() => {
    return <>
      {iframeSrc && !needToReloadIFrame &&
        <iframe
          ref={setContentRef}
          src={iframeSrc}
          style={parseFileFlag ? { position: "absolute", width: "100%", height: "100%" } : { position: "absolute", width: "100%", height: "100%", overflow: 'hidden',pointerEvents: 'none', opacity: 0.2 }}
        />}
    </>
  }, [iframeSrc, needToReloadIFrame, parseFileFlag])
}