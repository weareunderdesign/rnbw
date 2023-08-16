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
  HmsClearActionType,
  LogAllow,
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import { getValidNodeUids } from '@_node/apis';
import { TFileNodeData } from '@_node/file';
import { THtmlNodeData } from '@_node/html';
import {
  TNode,
  TNodeUid,
} from '@_node/types';
import {
  expandFFNode,
  expandFNNode,
  ffSelector,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFFNode,
  selectFNNode,
  setCurrentFile,
  updateFNTreeViewState,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import { TCmdkKeyMap } from '@_types/main';

import { jss } from './js';
import { styles } from './styles';
import { IFrameProps } from './types';

// const fallback img, audio, video images 
const defaultImage = "https://user-images.githubusercontent.com/13418616/234660226-dc0cb352-3735-478c-bcc0-d47f73eb3e31.svg"
const defaultAudio = "https://user-images.githubusercontent.com/13418616/234660225-7195abb2-91e7-402f-aa7d-902bbf7d66f8.svg"
const defaultVideo = "https://user-images.githubusercontent.com/13418616/234660227-aeb91595-1ed6-4b46-8197-c6feb7af3718.svg"
const firstClickEditableTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'a']
export const IFrame = (props: IFrameProps) => {
  const dispatch = useDispatch()
  const { file } = useSelector(navigatorSelector)
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { focusedItem, expandedItems, selectedItems, selectedItemsObj } = useSelector(fnSelector)
  const { expandedItemsObj } = useSelector(ffSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    navigatorDropDownType, setNavigatorDropDownType,
    // file tree view
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    setInitialFileToOpen,
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
    parseFileFlag, setParseFile,
    prevFileUid, setPrevFileUid,
    // close all panel
    closeAllPanel
  } = useContext(MainContext)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)
  const isEditing = useRef<boolean>(false)
  // mark hovered item
  const fnHoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  const mostRecentSelectedNode = useRef<TNode>()
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
  // iframe scroll event
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  const onIframeScroll = useCallback((e: Event) => {
    if (contentRef && focusedItemRef.current) {
      const newFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItemRef.current}"]`)
      const elementRect = (newFocusedElement as HTMLElement)?.getBoundingClientRect()
      if (elementRect) {
        if (elementRect.y < 0) {
          setCodeViewOffsetTop('calc(66.66vh - 12px)')
        }
        else {
          const innerHeight = contentRef?.contentWindow?.document.documentElement.clientHeight
          const elePosition = elementRect.y + elementRect.height / 2
          if (innerHeight) {
            if (elementRect.height < innerHeight / 2) {
              if (elePosition / innerHeight * 100 > 66) {
                setCodeViewOffsetTop('12px')
              }
              if (elePosition / innerHeight * 100 < 33) {
                setCodeViewOffsetTop('calc(66.66vh - 12px)')
              }
            }
          }
        }
      }
    }
  }, [contentRef])
  // mark&scroll to the focused item
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const newFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
    const elementRect = (newFocusedElement as HTMLElement)?.getBoundingClientRect()
    setTimeout(() => newFocusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' }), 50)
    if (elementRect) {
      if (elementRect.y < 0) {
        setCodeViewOffsetTop('calc(66.66vh - 12px)')
      }
      else {
        const innerHeight = contentRef?.contentWindow?.document.documentElement.clientHeight
        const elePosition = elementRect.y + elementRect.height / 2
        if (innerHeight) {
          if (elementRect.height < innerHeight / 2) {
            if (elePosition / innerHeight * 100 > 66) {
              setCodeViewOffsetTop('12px')
            }
            if (elePosition / innerHeight * 100 < 33) {
              setCodeViewOffsetTop('calc(66.66vh - 12px)')
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

    
    setTimeout(() => {
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
    }, 150);

  }, [selectedItems])
  // set/select item
  const setFocusedSelectedItems = useCallback((uid: TNodeUid, _selectedItems?: TNodeUid[]) => {
    addRunningActions(['stageView-focus'])

    // expand path to the uid
    const _expandedItems: TNodeUid[] = []
    let node = nodeTree[uid]
    if(!node) return
    mostRecentSelectedNode.current = node
    while (node.uid !== RootNodeUid) {
      _expandedItems.push(node.uid)
      node = nodeTree[node.parentUid as TNodeUid]
    }
    _expandedItems.shift()
    dispatch(expandFNNode(_expandedItems))

    dispatch(focusFNNode(uid))
    _selectedItems ? dispatch(selectFNNode(_selectedItems)) : dispatch(selectFNNode([uid]))

    focusedItemRef.current = uid

    const newFocusedElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
    const elementRect = (newFocusedElement as HTMLElement)?.getBoundingClientRect()
    setTimeout(() => newFocusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' }), 50)
    if (elementRect) {
      if (elementRect.y < 0) {
        setCodeViewOffsetTop('calc(66.66vh - 12px)')
      }
      else {
        const innerHeight = contentRef?.contentWindow?.document.documentElement.clientHeight
        const elePosition = elementRect.y + elementRect.height / 2
        if (innerHeight) {
          if (elementRect.height < innerHeight / 2) {
            if (elePosition / innerHeight * 100 > 66) {
              setCodeViewOffsetTop('12px')
            }
            if (elePosition / innerHeight * 100 < 33) {
              setCodeViewOffsetTop('calc(66.66vh - 12px)')
            }
          }
        }
      }
    }
    removeRunningActions(['stageView-focus'])
  }, [addRunningActions, removeRunningActions, nodeTree, contentRef])
  // -------------------------------------------------------------- side effect handlers --------------------------------------------------------------
  const addElement = useCallback((targetUid: TNodeUid, node: TNode, contentNode: TNode | null) => {
    // build new element
    const nodeData = node.data as THtmlNodeData
    let newElement
    if (nodeData.name === "!--...--" || nodeData.name === "comment") {
      const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
      // targetElement?.append('<!--...-->')
    }
    else if(nodeData.name === 'html') {
      newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
      for (const attrName in nodeData.attribs) {
        newElement && newElement?.setAttribute(attrName, nodeData.attribs[attrName])
      }
      if (contentNode && newElement) {
        const contentNodeData = contentNode.data as THtmlNodeData
        newElement.innerHTML = contentNodeData.htmlInApp
      }
      let existHTML = contentRef?.contentWindow?.document?.querySelector('html') as Node
      if (existHTML) {
        contentRef?.contentWindow?.document?.removeChild(existHTML)
      }
      newElement && contentRef?.contentWindow?.document?.appendChild(newElement)
      setNeedToReloadIFrame(true)
    }
    else{
      newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
      for (const attrName in nodeData.attribs) {
        newElement?.setAttribute(attrName, nodeData.attribs[attrName])
      }
      if (contentNode && newElement) {
        const contentNodeData = contentNode.data as THtmlNodeData
        newElement.innerHTML = contentNodeData.htmlInApp
      }
      // add after target
      const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
      newElement && targetElement?.parentElement?.insertBefore(newElement, targetElement.nextElementSibling)
    }
    // view state
    setTimeout(() => {
      dispatch(focusFNNode(node.uid))
      dispatch(selectFNNode([node.uid]))
    }, 100)
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef, nodeTree])
  const groupElement = useCallback((targetUid: TNodeUid, node: TNode, contentNode: TNode | null, deleteUids: TNodeUid[]) => {
    // build new element
    const nodeData = node.data as THtmlNodeData
    let newElement
    if (nodeData.name === "!--...--" || nodeData.name === "comment") {
      const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
      // targetElement?.append('<!--...-->')
    }
    else if(nodeData.name === 'html') {
      newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
      for (const attrName in nodeData.attribs) {
        newElement && newElement?.setAttribute(attrName, nodeData.attribs[attrName])
      }
      if (contentNode && newElement) {
        const contentNodeData = contentNode.data as THtmlNodeData
        newElement.innerHTML = contentNodeData.htmlInApp
      }
      let existHTML = contentRef?.contentWindow?.document?.querySelector('html') as Node
      if (existHTML) {
        contentRef?.contentWindow?.document?.removeChild(existHTML)
      }
      newElement && contentRef?.contentWindow?.document?.appendChild(newElement)
      setNeedToReloadIFrame(true)
    }
    else{
      newElement = contentRef?.contentWindow?.document?.createElement(nodeData.name)
      for (const attrName in nodeData.attribs) {
        newElement?.setAttribute(attrName, nodeData.attribs[attrName])
      }
      if (contentNode && newElement) {
        const contentNodeData = contentNode.data as THtmlNodeData
        newElement.innerHTML = contentNodeData.htmlInApp
      }
      // add after target
      const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
      newElement && targetElement?.appendChild(newElement)
    }

    // remove org elements
    deleteUids.map((uid) => {
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      ele?.remove()
    })
    // view state
    setTimeout(() => {
      dispatch(focusFNNode(node.uid))
      dispatch(selectFNNode([node.uid]))
      dispatch(expandFNNode([node.uid]))
    }, 200)
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const removeElements = useCallback((uids: TNodeUid[], deletedUids: TNodeUid[], lastUid: TNodeUid) => {
    uids.map((uid) => {
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
      ele?.remove()
    })
    setTimeout(() => {
      if (lastUid && lastUid !== '') {
        dispatch(focusFNNode(lastUid))
        dispatch(selectFNNode([lastUid]))
      }
    }, 200)
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
    setTimeout(() => {
      dispatch(focusFNNode(uids[uids.length - 1]))
      dispatch(selectFNNode(uids))
    }, 100)
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
    setTimeout(() => {
      dispatch(focusFNNode(newUids[newUids.length - 1]))
      dispatch(selectFNNode(newUids))
    }, 100)
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])
  const copyElementsExternal = useCallback((nodes: TNode[], targetUid: TNodeUid, isBetween: boolean, position: number, addedUidMap: Map<TNodeUid, TNodeUid>) => {
    const targetElement = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"]`)
    const refElement = isBetween ? contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${position + 1})`) : null

    nodes.map((node) => {
      let _ele: HTMLElement
      // clone
      const ele = (clipboardData.prevNodeTree[node.uid].data as THtmlNodeData).htmlInApp
      var div = document.createElement('div');
      div.innerHTML = ele.trim();

      // Change this to div.childNodes to support multiple top-level nodes.

      _ele = div.firstChild as HTMLElement
      // reset nest's uid
      const newUid = addedUidMap.get(node.uid)
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
    const newUids = nodes.map((node) => addedUidMap.get(node.uid)).filter(_nd => _nd) as TNodeUid[]
    setTimeout(() => {
      dispatch(focusFNNode(newUids[newUids.length - 1]))
      dispatch(selectFNNode(newUids))
    }, 100)
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef, clipboardData, file.uid])
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
    setTimeout(() => {
      dispatch(focusFNNode(newUids[newUids.length - 1]))
      dispatch(selectFNNode(newUids))
    }, 100)
    removeRunningActions(['stageView-viewState'])
  }, [removeRunningActions, contentRef])

  // change iframe theme
  useEffect(() => {
    let uid = '-1'
    for(let x in validNodeTree) {
      if (validNodeTree[x].data.name === 'html' && validNodeTree[x].data.type === 'tag') {
        uid = validNodeTree[x].uid
        break;
      }
    }
    const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
    if (contentRef) {
      if (
        theme !== 'Light'
      ) {
        ele?.setAttribute("data-theme", "dark")
      } else {
        ele?.setAttribute("data-theme", "light")
      }
    }
  }, [contentRef, theme, validNodeTree])
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
  const externalDblclick = useRef<boolean>(false)
  const onClick = useCallback((e: MouseEvent) => {
    if (!parseFileFlag) {
      const ele = e.target as HTMLElement
      const file = ffTree[prevFileUid]
      const uid = prevFileUid
      const fileData = file.data as TFileNodeData
      setNavigatorDropDownType('project')
      setParseFile(true)
      dispatch({ type: HmsClearActionType })
      dispatch(setCurrentFile({ uid, parentUid: file.parentUid as TNodeUid, name: fileData.name, content: fileData.contentInApp ? fileData.contentInApp : '' }))
      setCurrentFileUid(uid)
      dispatch(selectFFNode([prevFileUid]))

      // select clicked item
      let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
      // for the elements which are created by js. (ex: Web Component)
      let newFocusedElement: HTMLElement = ele
      while (!_uid) {
        const parentEle = newFocusedElement.parentElement
        if (!parentEle) break
  
        _uid = parentEle.getAttribute(NodeInAppAttribName)
        !_uid ? newFocusedElement = parentEle : null
      }
      setTimeout(() => {
        if (_uid) {
          dispatch(focusFNNode(_uid))
          dispatch(selectFNNode([_uid]))
          dispatch(expandFNNode([_uid]))
        }
      }, 100)
    }
    else {
      const ele = e.target as HTMLElement
      externalDblclick.current = true
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
      let isWC = false
      while (!_uid) {
        const parentEle = newFocusedElement.parentElement
        isWC = true
        if (!parentEle) break
  
        _uid = parentEle.getAttribute(NodeInAppAttribName)
        !_uid ? newFocusedElement = parentEle : null
      }
  
      // set focused/selected items
      let multiple = false
      if (_uid) {
        if (e.shiftKey) {
          let found = false
          const _selectedItems = selectedItemsRef.current.filter(uid => {
            uid === _uid ? found = true : null
            return uid !== _uid
          })
          !found ? _selectedItems.push(_uid) : null
          setFocusedSelectedItems(_uid, getValidNodeUids(nodeTree, _selectedItems))
          if(_selectedItems.length > 1) multiple = true
        } else {
          if (_uid !== focusedItem) {
            setFocusedSelectedItems(_uid)
          }
        }
      }
      // allow to edit content by one clicking for the text element
      if (firstClickEditableTags.filter(_ele => _ele === ele.tagName.toLowerCase()).length > 0 && !multiple && _uid === focusedItem && !isWC){
          if (contentEditableUidRef.current !== _uid) {
            isEditing.current = true
            console.log('dblclick')
            onDblClick(e)
            // ele.focus()
          }
      }
    }

    setActivePanel('stage')

    navigatorDropDownType !== null && setNavigatorDropDownType(null)
  }, [osType, focusedItem, setFocusedSelectedItems, nodeTree, parseFileFlag, navigatorDropDownType])

  // text editing
  const contentEditableUidRef = useRef('')
  const [contentEditableAttr, setContentEditableAttr] = useState<string | null>(null)
  const [outerHtml, setOuterHtml] = useState('')

  useEffect(() => {
  beforeTextEdit()
  }, [focusedItem])

  const onTextEdit = useCallback((node: TNode, _outerHtml: string) => {
    // replace enter to br
    while(true){
      _outerHtml = _outerHtml.replace('<div><br></div>', '<br>')
      if (_outerHtml.search('<div><br></div>') === -1)
        break
    }
    // const parser = new DOMParser();
    // const doc = parser.parseFromString(_outerHtml, 'text/html');
    // const tags = doc.querySelectorAll(`*`);

    // const contentArr = Array.from(tags).map(tag => {
    //   if (!tag.hasAttribute('data-rnbwdev-rnbw-node')) {
    //     return (tag.textContent as string).trim()
    //   }
    //   else {
    //     return tag.outerHTML
    //   }
    // });
    // const content = contentArr.join(" ");
    // (node.data as THtmlNodeData).htmlInApp
    
    // let modifiedHtml = content;
    // if (outerHtml === modifiedHtml) return

    setCodeChanges([{ uid: node.uid, content: _outerHtml }])
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: true, from: 'stage' })
    // expand path to the uid

    setTimeout(() => {
      dispatch(focusFNNode(node.uid))
    }, 10);
    // node.uid ? dispatch(selectFNNode([node.uid])) : dispatch(selectFNNode([node.uid]))
  }, [outerHtml])
    const beforeTextEdit = useCallback(() => {
    
    let node = validNodeTree[contentEditableUidRef.current]
    if (!node) return
    let ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`)
    // check if editing tags are <code> or <pre>
    let _parent = node.uid as TNodeUid
    let notParsingFlag = validNodeTree[node.uid].name === 'code' || validNodeTree[node.uid].name === 'pre' ? true : false
    while(_parent !== undefined && _parent !== null && _parent !== 'ROOT') {
      if (validNodeTree[_parent].name === 'code' || validNodeTree[_parent].name === 'pre') {
        notParsingFlag = true
        break;
      }
      _parent = validNodeTree[_parent].parentUid as TNodeUid
    }
    if (notParsingFlag) {
      ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${_parent}"]`)
      node = validNodeTree[_parent]
    }
    if (!node) return

    if (!ele) return
    contentEditableUidRef.current = ''
    isEditing.current = false

    contentEditableAttr ? ele.setAttribute('contenteditable', contentEditableAttr) : ele.removeAttribute('contenteditable')
    const cleanedUpCode = ele.outerHTML.replace(/rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g, '')
    onTextEdit(node, cleanedUpCode)
  }, [focusedItem])
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
      //https://github.com/rnbwdev/rnbw/issues/240
      if (contentEditableUidRef.current !== '') {
        const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`)
        ele?.removeAttribute('contenteditable')
        contentEditableUidRef.current = ''
        return
      }
      //
      closeAllPanel()
      return
    }

    if ((cmdk.cmd && cmdk.key === 'KeyG')) {
      e.preventDefault()
      e.stopPropagation();
      // return
    }

    if (cmdk.cmd && cmdk.key === 'Enter'){
      const ele = contentRef?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`)
      if (!ele) return
      (ele as HTMLElement).blur();
      setFocusedSelectedItems(focusedItem)
    }
  }, [focusedItem, validNodeTree, contentRef])
  useEffect(() => {
    function handleIframeLoad() {
      console.log('Iframe loaded');
    }

    const iframe = contentRef;
    if (iframe) {
      contentRef?.contentWindow?.document?.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframe) {
        contentRef?.contentWindow?.document?.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);
  const dblClickTimestamp = useRef(0)
  const onDblClick = useCallback((e: MouseEvent) => {
    // open new page with <a> tag in iframe
    const ele = e.target as HTMLElement
    if (dblClickTimestamp.current !== 0 && e.timeStamp - dblClickTimestamp.current < 500) return
    dblClickTimestamp.current = e.timeStamp
    let _ele = ele
    while(_ele.tagName !== 'A') {
      if (_ele.tagName === 'BODY' || _ele.tagName === 'HEAD' || _ele.tagName === 'HTML') {
        break
      }
      if (_ele.parentElement) {
        _ele = _ele.parentElement
      }
      else{
        break
      }
    }
    if (_ele.tagName === 'A' && (_ele as HTMLAnchorElement).href) {
      // window.open((_ele as HTMLAnchorElement).href, '_blank', 'noreferrer'); //issue:238
    }
    let uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName)
    if (uid) {
      const node = validNodeTree[uid]
      if (!node) return

      if (contentEditableUidRef.current === uid) return

      const nodeData = node.data as THtmlNodeData
      if (nodeData.name === 'html' || nodeData.name === 'head' || nodeData.name === 'body' || nodeData.name === 'img'  || nodeData.name === 'div') return

      const cleanedUpCode = ele.outerHTML.replace(/rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g, '')
      setOuterHtml(cleanedUpCode)
      if (ele.hasAttribute('contenteditable')) {
        setContentEditableAttr(ele.getAttribute('contenteditable'))
      }
      isEditing.current = true
      ele.addEventListener('paste', (event) => {
        event.preventDefault();
        if (isEditing.current) {
          // @ts-ignore
          const pastedText = (event.clipboardData || window.clipboardData).getData('text')

          // Remove all HTML tags from the pasted text while keeping the content using a regular expression
          const cleanedText = pastedText.replace(/<\/?([\w\s="/.':;#-\/\?]+)>/gi, (match: any, tagContent: any) => tagContent);
          cleanedText.replaceAll("\n\r", '<br>')
          // Insert the cleaned text into the editable div
          contentRef?.contentWindow?.document.execCommand('insertText', false, cleanedText);
          isEditing.current = false
          setTimeout(() => {
            isEditing.current = true
          }, 50);
        }
      });
      const clickEvent = new MouseEvent('click', {
        view: contentRef?.contentWindow,
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY
      });
      ele.setAttribute('contenteditable', 'true')

      contentEditableUidRef.current = uid
      
      ele.focus()
      //select all text
      

      contentEditableUidRef.current = uid
      
      // select all text
      const range = contentRef?.contentWindow?.document.createRange();

      if (range) {
        range.selectNodeContents(ele);
        const selection = contentRef?.contentWindow?.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);


      }
    }
    else {
      isEditing.current = false
      // check if it's a web component and open its js file
      let _ele = ele
      let flag = true
      let exist = false
      if (!externalDblclick.current)
      {
        while(flag) {
          if (_ele.getAttribute(NodeInAppAttribName) !== null) {
            let uid: TNodeUid | null = _ele.getAttribute(NodeInAppAttribName)
            if (uid) {
              for (let x in ffTree) {
                const node = validNodeTree[uid]
                const defineRegex = /customElements\.define\(\s*['"]([\w-]+)['"]/;
                if ((ffTree[x].data as TFileNodeData).content && (ffTree[x].data as TFileNodeData).ext === '.js') {
                  const match = ((ffTree[x].data as TFileNodeData).content).match(defineRegex);
                  if (match) {
                    // check web component
                    if (_ele.tagName.toLowerCase() === match[1].toLowerCase()) {
                      const fileName = (ffTree[x].data as TFileNodeData).name
                      let src = ''
                      for (let i in validNodeTree) {
                        if ((validNodeTree[i].data as THtmlNodeData).type === 'script' && (validNodeTree[i].data as THtmlNodeData).html.search(fileName + '.js') !== -1) {
                          src = (validNodeTree[i].data as THtmlNodeData).attribs.src
                          break
                        }
                      }
                      if (src !== '') {
                        if (src.startsWith('http') || src.startsWith('//')) {
                          alert('rnbw couldn\'t find it\'s source file')
                          flag = false
                          break
                        }
                        else{
                          setInitialFileToOpen(ffTree[x].uid)
                          setNavigatorDropDownType('project')
                          // expand path to the uid
                          const _expandedItems: string[] = []
                          let _file = ffTree[x]
                          while (_file && _file.uid !== RootNodeUid) {
                            _file = ffTree[_file.parentUid as string]
                            if (_file && !_file.isEntity && (!expandedItemsObj[_file.uid] || expandedItemsObj[_file.uid] === undefined))
                              _expandedItems.push(_file.uid)
                          }
                          dispatch(expandFFNode(_expandedItems))
                          flag = false
                          exist = true
                          break
                        }
                      }
                    }
                  }
                }
              }
              flag = false
            }
            else{
              flag = false
            }
          }
          else if (_ele.parentElement) {
            _ele = _ele.parentElement
          }
          else{
            flag = false
          }
        }
      }
      else{
        exist = true
      }

      if (!exist) {
        alert('rnbw couldn\'t find it\'s source file')
      }
    }
  }, [validNodeTree, ffTree, expandedItemsObj, contentRef])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    //We are trying to fina a way to get node id with this event
    if (contentEditableUidRef.current !== '') {
      let isSaving = e.key === 's' && (e.ctrlKey || e.metaKey)
      if (!isSaving) {
        return
      }
      type TTarget = HTMLElement & {
        dataset: {
          rnbwdevRnbwNode: string
        }
      }
      const target:TTarget|null = e.target as TTarget
      if (target && 'dataset' in target) {
        const uid = target.dataset.rnbwdevRnbwNode      
        if (uid) {
          let uid = mostRecentSelectedNode.current?.uid as TNodeUid
          let parentUid = mostRecentSelectedNode.current?.parentUid as TNodeUid
        }

        //TODO: IN_PROGRESS

      }
    }
    

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
  }, [cmdkReferenceData,nodeTree])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const linkTagUid = useRef<TNodeUid>('')

  // iframe event listeners
  const [iframeEvent, setIframeEvent] = useState<MouseEvent | PointerEvent>()

  // iframe skeleton
  const Skeleton = () => {
    return <div>Cool loading screen</div>;
  };
  useEffect(() => {
    if (contentRef) {
      dblClickTimestamp.current = 0
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

          // add js
          const js = _document.createElement('script')
          js.setAttribute('image-validator', 'true')
          js.textContent = jss
          headNode.appendChild(js)

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
          // htmlNode.addEventListener('dblclick', (e: MouseEvent) => {
          //   externalDblclick.current = false
          //   setIframeEvent(e)
          // })
          let lastClickTime = 0;
          htmlNode.addEventListener('pointerdown', (e: PointerEvent) => {
            const currentTime = e.timeStamp;
            const timeSinceLastClick = currentTime - lastClickTime;
            if (timeSinceLastClick < 500) {
              externalDblclick.current = false
              setIframeEvent(e)
            }
            lastClickTime = currentTime;
          });

          htmlNode.addEventListener('keydown', (e: KeyboardEvent) => {
            onCmdEnter(e)
          })
          _document.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault()
          })
          _document.addEventListener('scroll', (e: Event) => {
            onIframeScroll(e)
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
          removeElements(...param as [TNodeUid[], TNodeUid[], TNodeUid])
          break
        case 'move-node':
          moveElements(...param as [TNodeUid[], TNodeUid, boolean, number])
          break
        case 'copy-node':
          copyElements(...param as [TNodeUid[], TNodeUid, boolean, number, Map<TNodeUid, TNodeUid>])
          break
        case 'copy-node-external':
          copyElementsExternal(...param as [TNode[], TNodeUid, boolean, number, Map<TNodeUid, TNodeUid>])
          break
        case 'duplicate-node':
          duplicateElements(...param as [TNodeUid[], Map<TNodeUid, TNodeUid>])
          break
        case 'group-node':
          groupElement(...param as [TNodeUid, TNode, TNode | null, TNodeUid[]])
          break
        default:
          break
      }
    }
  }, [event])
  // reload when script changes
  useEffect(() => {
    if (needToReloadIFrame) {
      contentRef?.contentWindow?.location.reload()
      setNeedToReloadIFrame(false)
      linkTagUid.current = ''
    }
  }, [needToReloadIFrame, contentRef])

  return useMemo(() => {
    return <>
      {iframeSrc && !needToReloadIFrame &&
        <iframe
          ref={setContentRef}
          src={iframeSrc}
          style={parseFileFlag ? { background:"white", position: "absolute", width: "100%", height: "100vh" } : { background:"white", position: "absolute", width: "100%", height: "100vh", overflow: 'hidden'}}
        />}
    </>
  }, [iframeSrc, needToReloadIFrame, parseFileFlag, prevFileUid, setParseFile])
}