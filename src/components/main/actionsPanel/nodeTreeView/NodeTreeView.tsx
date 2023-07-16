import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  SVGIconI,
  SVGIconII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  AddNodeActionPrefix,
  HmsClearActionType,
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import {
  addNode,
  copyNode,
  copyNodeExternal,
  duplicateNode,
  getNodeChildIndex,
  getValidNodeUids,
  moveNode,
  parseHtmlCodePart,
  removeNode,
  TFileNodeData,
  THtmlElementsReference,
  THtmlNodeData,
} from '@_node/index';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from '@_node/types';
import {
  collapseFNNode,
  expandFFNode,
  expandFNNode,
  ffSelector,
  fnSelector,
  focusFNNode,
  increaseActionGroupIndex,
  MainContext,
  navigatorSelector,
  selectFFNode,
  selectFNNode,
  setCurrentFile,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import {
  addClass,
  removeClass,
} from '@_services/main';

import { NodeTreeViewProps } from './types';

const AutoExpandDelay = 1 * 1000
export default function NodeTreeView(props: NodeTreeViewProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { focusedItem, expandedItems, selectedItems, selectedItemsObj } = useSelector(fnSelector)
  const {expandedItemsObj} = useSelector(ffSelector)
  const {
    project,
    // global action
    addRunningActions, removeRunningActions,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    navigatorDropDownType, setNavigatorDropDownType,
    event, setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    setInitialFileToOpen,
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
    theme: _theme,
    // toasts
    addMessage, removeMessage,
    parseFileFlag, setParseFile,
    prevFileUid, setPrevFileUid,
  } = useContext(MainContext)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(fnHoveredItem)
  useEffect(() => {
    if (hoveredItemRef.current === fnHoveredItem) return

    const curHoveredElement = document.querySelector(`#NodeTreeView-${hoveredItemRef.current}`)
    curHoveredElement?.setAttribute('class', removeClass(curHoveredElement.getAttribute('class') || '', 'outline'))
    const newHoveredElement = document.querySelector(`#NodeTreeView-${fnHoveredItem}`)
    newHoveredElement?.setAttribute('class', addClass(newHoveredElement.getAttribute('class') || '', 'outline'))

    hoveredItemRef.current = fnHoveredItem
  }, [fnHoveredItem])
  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const focusedElement = document.querySelector(`#NodeTreeView-${focusedItem}`)
    setTimeout(() => focusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'auto' }), 50)

    const newFocusedElement = document.getElementsByTagName('iframe')[0]?.contentWindow?.document?.querySelector(`[${NodeInAppAttribName}="${focusedItem}"]`)
    setTimeout(() => newFocusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' }), 100)

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // build nodeTreeViewData
  const nodeTreeViewData = useMemo(() => {
    const data: TreeViewData = {}
    for (const uid in validNodeTree) {
      const node = validNodeTree[uid]
      data[uid] = {
        index: node.uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      }
    }
    return data
  }, [validNodeTree])
  // -------------------------------------------------------------- node actions handlers --------------------------------------------------------------
  const cb_addNode = useCallback((nodeType: string) => {
    if (!nodeTree[focusedItem]) return

    addRunningActions(['nodeTreeView-add'])

    // build node to add
    const newNode: TNode = {
      uid: String(nodeMaxUid + 1) as TNodeUid,
      parentUid: nodeTree[focusedItem].parentUid as TNodeUid,
      name: nodeType,
      isEntity: true,
      children: [],
      data: {
        valid: true,
        isFormatText: false,

        type: 'tag',
        name: nodeType,
        data: '',
        attribs: { [NodeInAppAttribName]: String(nodeMaxUid + 1) as TNodeUid },

        html: '',
        htmlInApp: '',

        startLineNumber: 0,
        startColumn: 0,
        endLineNumber: 0,
        endColumn: 0,
      } as THtmlNodeData
    }
    let contentNode: TNode | null = null
    let tempTree 
    let _tree: TNodeTreeData | null = null
    let tmpMaxUid: TNodeUid = String(nodeMaxUid)
    let newNodeFlag = false
    const refData = htmlReferenceData.elements[nodeType]
    if (refData) {
      const { Attributes, Content } = refData
      if (Attributes) {
        const newNodeData = newNode.data as THtmlNodeData
        let temp = ""
        Attributes.split(' ').map(attr => {
          temp = temp + ' ' + attr
          if (attr === 'controls') {
            newNodeData.attribs['controls'] = ''
          }
          if ((temp.match(/”/g) || [])?.length > 1 || (temp.match(/"/g) || [])?.length > 1) {
            const parseAttr = temp.split('=')
            newNodeData.attribs[parseAttr[0].trim()] = parseAttr[1].replace('”', '').replace('”', '').replace('"', '').replace('"', '')
            temp = ""
          }
        })
      }
      if (Content) {
        newNodeFlag = true
        let parserRes = parseHtmlCodePart(Content, htmlReferenceData, osType, String(nodeMaxUid) as TNodeUid)
        const { formattedContent, tree, nodeMaxUid: newNodeMaxUid } = parserRes
        tmpMaxUid = newNodeMaxUid
        _tree = tree
        newNode.isEntity = false
        newNode.children = [String(nodeMaxUid + 2) as TNodeUid]
        contentNode = {
          uid: String(nodeMaxUid + 2) as TNodeUid,
          parentUid: String(nodeMaxUid + 1) as TNodeUid,
          name: 'text',
          isEntity: true,
          children: [],
          data: {
            valid: false,
            isFormatText: false,

            type: 'text',
            name: 'text',
            data: Content,
            attribs: { [NodeInAppAttribName]: tmpMaxUid as TNodeUid },

            html: '',
            htmlInApp: '',

            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0,
          } as THtmlNodeData
        } as TNode
      }
    }

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree))
    if (_tree) {
      let _parent = tree[nodeTree[focusedItem].parentUid as TNodeUid]
      for (let x in _tree) {
        if (x === 'text') {
          continue
        }
        if (x === 'ROOT') {
          _tree[x].uid = String(Number(tmpMaxUid) + 1)
          _tree[x].parentUid = focusedItem !== 'ROOT' && _parent !== undefined ? nodeTree[focusedItem].parentUid : 'ROOT'
          _tree[x].name = newNode.name
          _tree[x].data.type = 'tag'
          _tree[x].data.name = newNode.name
          _tree[x].data.valid = true;
          (_tree[x].data as THtmlNodeData).attribs = { [NodeInAppAttribName]: String(Number(tmpMaxUid) + 1) as TNodeUid }
          newNode.uid = String(Number(tmpMaxUid) + 1)
          tree[String(Number(tmpMaxUid) + 1)] = _tree[x]
          if (focusedItem !== 'ROOT' && _parent !== undefined) {
            _parent.children.push(String(Number(tmpMaxUid) + 1))
          }
          else{
            tree['ROOT'].children.push(String(Number(tmpMaxUid) + 1))
          }
          // const node = _tree[x]
          // if (node) {
          //   const nodeData = node.data as THtmlNodeData
          //   const attribsHtml = nodeData.attribs === undefined ? '' :
          //   Object.keys(nodeData.attribs).map(attr => {
          //     if (attr === NodeInAppAttribName) return
          //     if (attr === 'class') {
          //       const className = (nodeData.attribs['class'] as string).split(' ').filter(className => !!className).join(' ')
          //       if (className === '') return
          //       return ` class="${className}"`
          //     }
  
          //     const attrContent = nodeData.attribs[attr] as string
          //     return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
          //   }).join('')
  
          //   const attribsHtmlInApp = nodeData.attribs === undefined ? '' :
          //   Object.keys(nodeData.attribs).map(attr => {
          //     const attrContent = nodeData.attribs[attr]
          //     return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
          //   }).join('')
          // }
        }
        else{
          if (_tree[x].parentUid === 'ROOT') {
            _tree[x].parentUid = String(Number(tmpMaxUid) + 1)
          }
          if (_tree[x].name === 'text'){
            (_tree[x].data as TNormalNodeData).isFormatText = false
          }
          tree[x] = _tree[x]
        }
      }
      // const res = addNode(tree, focusedItem, newNode, contentNode, 'html', String(contentNode ? nodeMaxUid + 2 : nodeMaxUid + 1) as TNodeUid, osType, tabSize)
    }
    else{
      const res = addNode(tree, focusedItem, newNode, contentNode, 'html', String(contentNode ? nodeMaxUid + 2 : nodeMaxUid + 1) as TNodeUid, osType, tabSize)
      tempTree = res.tree
      tmpMaxUid = res.nodeMaxUid as TNodeUid
    }
    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(tree)

    // view state
    addRunningActions(['stageView-viewState'])
    setUpdateOpt({ parse: true, from: 'code' })

    // side effect
    setNodeMaxUid(Number(tmpMaxUid) + 1)
    setEvent({ type: 'add-node', param: [focusedItem, newNodeFlag ? tree[Number(tmpMaxUid) + 1] : newNode, tree[newNode.uid]] })

    removeRunningActions(['nodeTreeView-add'])
    console.log('hms added')
    dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, focusedItem, nodeMaxUid, osType, tabSize, htmlReferenceData])
  const cb_removeNode = useCallback((uids: TNodeUid[]) => {
    let allow = true
    let htmlTagCount = 0, bodyTagCount = 0, headTagCount = 0
    for( let x in nodeTree ) {
      (nodeTree[x]?.data as THtmlNodeData).name === 'html' && (nodeTree[x]?.data as THtmlNodeData).type === 'tag' && htmlTagCount ++
      (nodeTree[x]?.data as THtmlNodeData).name === 'body' && (nodeTree[x]?.data as THtmlNodeData).type === 'tag' && bodyTagCount ++
      (nodeTree[x]?.data as THtmlNodeData).name === 'head' && (nodeTree[x]?.data as THtmlNodeData).type === 'tag' && headTagCount ++
    }
    uids.map(_uid => {
      const node = nodeTree[_uid]
      const nodeData = nodeTree[_uid].data as THtmlNodeData
      if (!node || !nodeData) {
        allow = false
        return
      }
      if ((nodeData.name === 'html' && nodeData.type === 'tag' && htmlTagCount === 1) || (nodeData.name === 'head' && nodeData.type === 'tag' && headTagCount === 1) || (nodeData.name === 'body' && nodeData.type === 'tag' && bodyTagCount === 1)) {
        allow = false
        return
      }
    })
    if (allow) {
      addRunningActions(['nodeTreeView-remove'])

      // call api
      const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
      const res = removeNode(tree, uids, 'html')

      // processor
      addRunningActions(['processor-updateOpt'])
      setUpdateOpt({ parse: false, from: 'node' })
      setNodeTree(res.tree)

      // view state
      addRunningActions(['stageView-viewState'])
      setUpdateOpt({ parse: true, from: 'code' })
      // side effect
      setEvent({ type: 'remove-node', param: [uids, res.deletedUids, res.lastNodeUid] })

      removeRunningActions(['nodeTreeView-remove'])
      console.log('hms added')
      dispatch(increaseActionGroupIndex())
    }
    else{
      console.log('Can\'t remove this element because it\'s an unique element of this page')
    }
  }, [addRunningActions, removeRunningActions, nodeTree])
  const cb_duplicateNode = useCallback((uids: TNodeUid[]) => {
    addRunningActions(['nodeTreeView-duplicate'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = duplicateNode(tree, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])
    setUpdateOpt({ parse: true, from: 'code' })
    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'duplicate-node', param: [uids, res.addedUidMap] })

    removeRunningActions(['nodeTreeView-duplicate'])
    console.log('hms added')
    dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize])
  const cb_copyNode = useCallback((uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    addRunningActions(['nodeTreeView-copy'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = copyNode(tree, targetUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    setUpdateOpt({ parse: true, from: 'code' })
    // view state
    addRunningActions(['stageView-viewState'])
    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    
    setEvent({ type: 'copy-node', param: [uids, targetUid, isBetween, position, res.addedUidMap] })

    removeRunningActions(['nodeTreeView-copy'])
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize])
  const cb_copyNodeExternal = useCallback((nodes: TNode[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    addRunningActions(['nodeTreeView-copy'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = copyNodeExternal(tree, targetUid, isBetween, position, nodes, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize, clipboardData.prevNodeTree)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)
    // view state
    addRunningActions(['stageView-viewState'])
    setUpdateOpt({ parse: true, from: 'code' })
    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'copy-node-external', param: [nodes, targetUid, isBetween, position, res.addedUidMap] })
    removeRunningActions(['nodeTreeView-copy'])

    console.log('hms added')
    dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, nodeMaxUid, osType, tabSize, clipboardData])
  const cb_moveNode = useCallback((_uids: TNodeUid[], targetUid: TNodeUid, isBetween: boolean, position: number) => {
    // validate
    const uids = getValidNodeUids(nodeTree, _uids, targetUid, 'html', htmlReferenceData)
    if (uids.length === 0) return

    addRunningActions(['nodeTreeView-move'])

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData
    const res = moveNode(tree, targetUid, isBetween, position, uids, 'html', String(nodeMaxUid) as TNodeUid, osType, tabSize)

    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(res.tree)

    // view state
    addRunningActions(['stageView-viewState'])
    // side effect
    setNodeMaxUid(Number(res.nodeMaxUid))
    setEvent({ type: 'move-node', param: [uids, targetUid, isBetween, res.position] })

    removeRunningActions(['nodeTreeView-move'])

    console.log('hms added')
    dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, htmlReferenceData, nodeMaxUid, osType, tabSize])
  const cb_groupNode = useCallback((_uids: TNodeUid[], targetUid: TNodeUid, position: number) => {
    let Content: string = ''

    let uids: TNodeUid[] = []
    for (let x in _uids) {
      if(!(nodeTree[_uids[x]].parentUid === RootNodeUid)) {
        uids.push(_uids[x])
        Content += (nodeTree[_uids[x]].data as THtmlNodeData).html as string
      }
    }
    if (uids.length === 0) return

    addRunningActions(['nodeTreeView-group'])

    // add new div
    const newNode: TNode = {
      uid: String(nodeMaxUid + 1) as TNodeUid,
      parentUid: nodeTree[targetUid].parentUid as TNodeUid,
      name: 'div',
      isEntity: true,
      children: [],
      data: {
        valid: true,
        isFormatText: false,

        type: 'tag',
        name: 'div',
        data: '',
        attribs: { [NodeInAppAttribName]: String(nodeMaxUid + 1) as TNodeUid },

        html: '',
        htmlInApp: '',

        startLineNumber: 0,
        startColumn: 0,
        endLineNumber: 0,
        endColumn: 0,
      } as THtmlNodeData
    }
    let contentNode: TNode | null = null
    let _tree: TNodeTreeData | null = null
    let tmpMaxUid: TNodeUid = String(nodeMaxUid)
    let newNodeFlag = false
    let uidOffset = 0
    const refData = htmlReferenceData.elements['div']
    if (refData) {
      const { Attributes } = refData
      if (Attributes) {
        const newNodeData = newNode.data as THtmlNodeData
        let temp = ""
        Attributes.split(' ').map(attr => {
          temp = temp + ' ' + attr
          if (attr === 'controls') {
            newNodeData.attribs['controls'] = ''
          }
          if ((temp.match(/”/g) || [])?.length > 1 || (temp.match(/"/g) || [])?.length > 1) {
            const parseAttr = temp.split('=')
            newNodeData.attribs[parseAttr[0].trim()] = parseAttr[1].replace('”', '').replace('”', '').replace('"', '').replace('"', '')
            temp = ""
          }
        })
      }
      if (Content) {
        newNodeFlag = true
        let parserRes = parseHtmlCodePart(Content, htmlReferenceData, osType, String(nodeMaxUid) as TNodeUid)
        const { formattedContent, tree, nodeMaxUid: newNodeMaxUid } = parserRes
        tmpMaxUid = newNodeMaxUid
        _tree = tree
        newNode.isEntity = false
        newNode.children = [String(nodeMaxUid + 2) as TNodeUid]
        contentNode = {
          uid: String(nodeMaxUid + 2) as TNodeUid,
          parentUid: String(nodeMaxUid + 1) as TNodeUid,
          name: 'text',
          isEntity: true,
          children: [],
          data: {
            valid: false,
            isFormatText: false,

            type: 'text',
            name: 'text',
            data: Content,
            attribs: { [NodeInAppAttribName]: tmpMaxUid as TNodeUid },

            html: '',
            htmlInApp: '',

            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0,
          } as THtmlNodeData
        } as TNode
      }
    }

    // call api
    const tree = JSON.parse(JSON.stringify(nodeTree))
    
    const _parent = nodeTree[nodeTree[targetUid].parentUid as TNodeUid]
    let validChildIndex = 0
    for (const childUid of _parent.children) {
      tree[childUid].data.valid && ++validChildIndex
    }
    validChildIndex < position && ++uidOffset
    const _position = position - uidOffset
    if (_tree) {
      let _parent = tree[nodeTree[targetUid].parentUid as TNodeUid]
      for (let x in _tree) {
        if (x === 'text') continue
        if (x === 'ROOT') {
          _tree[x].uid = String(Number(tmpMaxUid) + 1)
          _tree[x].parentUid = targetUid !== 'ROOT' && _parent !== undefined ? nodeTree[targetUid].parentUid : 'ROOT'
          _tree[x].name = newNode.name
          _tree[x].data.type = 'tag'
          _tree[x].data.name = newNode.name
          _tree[x].data.valid = true;
          (_tree[x].data as THtmlNodeData).attribs = { [NodeInAppAttribName]: String(Number(tmpMaxUid) + 1) as TNodeUid }
          newNode.uid = String(Number(tmpMaxUid) + 1)
          tree[String(Number(tmpMaxUid) + 1)] = _tree[x]
          if (targetUid !== 'ROOT' && _parent !== undefined) {
            let newUid = String(Number(tmpMaxUid) + 1)
            _parent.children.splice(_position, 0, newUid)
          }
          else{
            tree['ROOT'].children.push(String(Number(tmpMaxUid) + 1))
          }
        }
        else{
          if (_tree[x].parentUid === 'ROOT') {
            _tree[x].parentUid = String(Number(tmpMaxUid) + 1)
          }
          tree[x] = _tree[x]
        }
      }
      // const res = addNode(tree, focusedItem, newNode, contentNode, 'html', String(contentNode ? nodeMaxUid + 2 : nodeMaxUid + 1) as TNodeUid, osType, tabSize)
    }
    // remove org elements in nodeTree
    const res = removeNode(tree, uids, 'html')
    // processor
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: false, from: 'node' })
    setNodeTree(tree)

    // view state
    addRunningActions(['stageView-viewState'])
    setUpdateOpt({ parse: true, from: 'code' })

    // side effect
    setNodeMaxUid(Number(tmpMaxUid) + 1)
    setEvent({ type: 'group-node', param: [nodeTree[targetUid].parentUid, newNodeFlag ? tree[Number(tmpMaxUid) + 1] : newNode, tree[newNode.uid], uids] })

    removeRunningActions(['nodeTreeView-group'])
    console.log('hms added')
    dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, htmlReferenceData, nodeMaxUid, osType, tabSize])
  const cb_unGroupNode = useCallback((_uids: TNodeUid[], targetUid: TNodeUid) => {
    let uids: TNodeUid[] = []
    for (let x in _uids) {
      if(!(nodeTree[_uids[x]].parentUid === RootNodeUid) && (nodeTree[_uids[x]].name !== 'br') && (nodeTree[_uids[x]].name !== 'script') && (nodeTree[_uids[x]].name !== 'style')) {
        uids.push(_uids[x])
      }
    }
    if (uids.length === 0) return

    // addRunningActions(['nodeTreeView-group'])
    // let deletedUids = []
    // let contentNode: TNode | null = null
    // let _tree: TNodeTreeData | null = null
    // let tmpMaxUid: TNodeUid = String(nodeMaxUid)
    // let newNodeFlag = false
    // let codeChanges: TCodeChange[] = []
    // uids.map((uid: string) => {
    //   const node = nodeTree[uid] as TNode
    //   const _parent = nodeTree[nodeTree[uid].parentUid as TNodeUid]
    //   const nodeData = nodeTree[uid].data as THtmlNodeData
    //   if (!node || !_parent || _parent.uid === 'ROOT' || node.children.length === 0) return
    //   // remove org elements
    //   deletedUids.push(uid)
    //   const childIndex = getNodeChildIndex(_parent, node)
    //   let content: string = (_parent.data as THtmlNodeData).html
    //   // content.replace
    //   codeChanges.push({ uid , content })
    // })
    
    // // view state
    // addRunningActions(['stageView-viewState'])
    // setCodeChanges(codeChanges)
    // addRunningActions(['processor-updateOpt'])
    // setUpdateOpt({ parse: true, from: 'code' })

    // // side effect
    // setNodeMaxUid(Number(tmpMaxUid) + 1)
    // // setEvent({ type: 'group-node', param: [nodeTree[targetUid].parentUid, newNodeFlag ? tree[Number(tmpMaxUid) + 1] : newNode, tree[newNode.uid], uids] })
    
    // removeRunningActions(['nodeTreeView-ungroup'])
    // console.log('hms added')
    // dispatch(increaseActionGroupIndex())
  }, [addRunningActions, removeRunningActions, nodeTree, htmlReferenceData, nodeMaxUid, osType, tabSize])
  // -------------------------------------------------------------- node view state handlers --------------------------------------------------------------
  const cb_focusNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-focus'])

    // validate
    if (focusedItem === uid) {
      removeRunningActions(['nodeTreeView-focus'], false)
      return
    }

    dispatch(focusFNNode(uid))
    focusedItemRef.current = uid

    removeRunningActions(['nodeTreeView-focus'])
  }, [addRunningActions, removeRunningActions, focusedItem])
  const cb_selectNode = useCallback((uids: TNodeUid[]) => {
    addRunningActions(['nodeTreeView-select'])

    // validate
    const _uids = getValidNodeUids(validNodeTree, uids)
    if (_uids.length === selectedItems.length) {
      let same = true
      for (const _uid of _uids) {
        if (selectedItemsObj[_uid] === undefined) {
          same = false
          break
        }
      }
      if (same) {
        removeRunningActions(['nodeTreeView-select'], false)
        return
      }
    }

    dispatch(selectFNNode(_uids))

    if (!parseFileFlag) {
      const node = ffTree[prevFileUid]
      const uid = prevFileUid
      const nodeData = node.data as TFileNodeData
      setParseFile(true)
      setNavigatorDropDownType('project')
      dispatch({ type: HmsClearActionType })
      dispatch(setCurrentFile({ uid, parentUid: node.parentUid as TNodeUid, name: nodeData.name, content: nodeData.contentInApp ? nodeData.contentInApp : '' }))
      setCurrentFileUid(uid)
      dispatch(selectFFNode([prevFileUid]))
    }
    removeRunningActions(['nodeTreeView-select'])
  }, [addRunningActions, removeRunningActions, validNodeTree, selectedItems, selectedItemsObj, parseFileFlag])
  const cb_expandNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-arrow'])

    dispatch(expandFNNode([uid]))

    removeRunningActions(['nodeTreeView-arrow'])
  }, [addRunningActions, removeRunningActions])
  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['nodeTreeView-arrow'])

    dispatch(collapseFNNode([uid]))

    removeRunningActions(['nodeTreeView-arrow'])
  }, [addRunningActions, removeRunningActions])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  useEffect(() => {
    if (isAddNodeAction(currentCommand.action)) {
      onAddNode(currentCommand.action)
      return
    }

    if (activePanel !== 'node' && activePanel !== 'stage') return

    switch (currentCommand.action) {
      case 'Cut':
        onCut()
        break
      case 'Copy':
        onCopy()
        break
      case 'Paste':
        onPaste()
        break
      case 'Delete':
        onDelete()
        break
      case 'Duplicate':
        onDuplicate()
        break

      case 'Turn into':
        onTurnInto()
        break
      case 'Group':
        onGroup()
        break
      case 'Ungroup':
        onUngroup()
        break

      default:
        break
    }
  }, [currentCommand])

  const onCut = useCallback(() => {
    if (selectedItems.length === 0) return
    let data: TNode[] = []
    for (let x in selectedItems) {
      if (validNodeTree[selectedItems[x]]) {
        data.push(validNodeTree[selectedItems[x]])
      }
    }
    setClipboardData({ panel: 'node', type: 'cut', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: data, fileUid: file.uid, prevNodeTree: nodeTree })
  }, [selectedItems, ffTree[file.uid], nodeTree])
  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return
    let data: TNode[] = []
    for (let x in selectedItems) {
      if (validNodeTree[selectedItems[x]]) {
        data.push(validNodeTree[selectedItems[x]])
      }
    }
    setClipboardData({ panel: 'node', type: 'copy', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: data, fileUid: file.uid, prevNodeTree: nodeTree })
  }, [selectedItems, ffTree[file.uid], nodeTree])
  const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'node') return

    const uids = clipboardData.uids.filter(uid => !!validNodeTree[uid])
    const datas = clipboardData.data.filter(data => data.data.valid)
    const focusedNode = validNodeTree[focusedItem]
    
    if (focusedNode === undefined) return

    const parentNode = validNodeTree[focusedNode.parentUid as TNodeUid]

    if (parentNode === undefined) return

    const childIndex = getNodeChildIndex(parentNode, focusedNode)

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'unknown', type: null, uids: [], fileType: 'html', data: [], fileUid: '', prevNodeTree: {} })
      if (file.uid === clipboardData.fileUid) {
        cb_moveNode(uids, parentNode.uid, true, childIndex + 1)
      }
      else{
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
    } else {
      if (file.uid === clipboardData.fileUid) {
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
      else{
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
    }
  }, [clipboardData, validNodeTree, focusedItem, cb_moveNode, cb_copyNode, file.uid, cb_copyNodeExternal])
  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_removeNode(selectedItems)
  }, [cb_removeNode, selectedItems])
  const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_duplicateNode(selectedItems)
  }, [cb_duplicateNode, selectedItems])

  const onTurnInto = useCallback(() => { }, [])
  const onGroup = useCallback(() => { 
    if (selectedItems.length === 0) return
    let bodyUid: TNodeUid = '0'
    for (let x in validNodeTree) {
      const nodeData = validNodeTree[x].data as THtmlNodeData
      if (nodeData && nodeData.type === 'tag' && nodeData.name === 'body') {
        let _parent = validNodeTree[validNodeTree[x].parentUid as TNodeUid]
        while(_parent.parentUid !== 'ROOT') {
          if ((_parent.data as THtmlNodeData).type === 'tag' && ((_parent.data as THtmlNodeData).name === 'pre' || (_parent.data as THtmlNodeData).name === 'code')) {
            break
          }
          _parent = validNodeTree[validNodeTree[x].parentUid as TNodeUid]
        }
        bodyUid = validNodeTree[x].uid
      }
    }
    let _focusedItem: TNodeUid = '0'
    for (let x in selectedItems) {
      let _parent = validNodeTree[selectedItems[x]]
      while (_parent.parentUid !== 'ROOT') {
        if (_parent.parentUid === bodyUid){
          _focusedItem = selectedItems[x]
          break
        }
        _parent = validNodeTree[_parent.parentUid as TNodeUid]
      }
    }
    if (_focusedItem === '0') return
    console.log('Group', selectedItems, _focusedItem)

    const childIndex = getNodeChildIndex(validNodeTree[validNodeTree[_focusedItem].parentUid as TNodeUid], validNodeTree[_focusedItem])

    cb_groupNode(selectedItems, _focusedItem, childIndex + 1)
  }, [cb_groupNode, selectedItems, validNodeTree])
  const onUngroup = useCallback(() => {
    let bodyUid: TNodeUid = '0'
    for (let x in validNodeTree) {
      const nodeData = validNodeTree[x].data as THtmlNodeData
      if (nodeData && nodeData.type === 'tag' && nodeData.name === 'body') {
        let _parent = validNodeTree[validNodeTree[x].parentUid as TNodeUid]
        while(_parent.parentUid !== 'ROOT') {
          if ((_parent.data as THtmlNodeData).type === 'tag' && ((_parent.data as THtmlNodeData).name === 'pre' || (_parent.data as THtmlNodeData).name === 'code')) {
            break
          }
          _parent = validNodeTree[validNodeTree[x].parentUid as TNodeUid]
        }
        bodyUid = validNodeTree[x].uid
      }
    }
    let _focusedItem: TNodeUid = '0'
    for (let x in selectedItems) {
      let _parent = validNodeTree[selectedItems[x]]
      while (_parent.parentUid !== 'ROOT') {
        if (_parent.parentUid === bodyUid){
          _focusedItem = selectedItems[x]
          break
        }
        _parent = validNodeTree[_parent.parentUid as TNodeUid]
      }
    }
    if (_focusedItem === '0') return
    console.log('Ungroup', selectedItems, _focusedItem)

    cb_unGroupNode(selectedItems, _focusedItem)
   }, [cb_unGroupNode, selectedItems, validNodeTree])

  const isAddNodeAction = (actionName: string): boolean => {
    return actionName.startsWith(AddNodeActionPrefix) ? true : false
  }
  const onAddNode = useCallback((actionName: string) => {
    const tagName = actionName.slice(AddNodeActionPrefix.length + 2, actionName.length - 1)
    cb_addNode(tagName)
  }, [cb_addNode])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback(() => {
    setActivePanel('node')

    navigatorDropDownType !== null && setNavigatorDropDownType(null)
  }, [navigatorDropDownType])

  // ------------------------------------------------------------- open wc -------------------------------------------------------------
  const openWebComponent = useCallback((item: TNodeUid) => {
    // check the element is wc
    const nodeData = validNodeTree[item].data as THtmlNodeData
    let exist = false
    if (nodeData && htmlReferenceData.elements[nodeData.name] === undefined && nodeData.type === 'tag') {
      const wcName = nodeData.name
      for (let x in ffTree) {
        const defineRegex = /customElements\.define\(\s*['"]([\w-]+)['"]/;
        if ((ffTree[x].data as TFileNodeData).content && (ffTree[x].data as TFileNodeData).ext === '.js') {
          const match = ((ffTree[x].data as TFileNodeData).content).match(defineRegex);
          if (match) {
            // check web component
            if (wcName === match[1].toLowerCase()) {
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
                  exist = true
                  break
                }
              }
            }
          }
        }
      }

      if (!exist) {
        alert('rnbw couldn\'t find it\'s source file')
      }
    }
  }, [htmlReferenceData, validNodeTree, ffTree])

  const isDragging = useRef<boolean>(false)

  return useMemo(() => {
    return file.uid !== '' ? <>
      <div
        id="NodeTreeView"
        style={{
          // position: 'absolute',
          top: 41,
          left: 0,
          width: '100%',
          height: 'calc(100% - 41px)',

          overflow: 'auto',
        }}
        onClick={onPanelClick}
      >
        <TreeView
          width={'100%'}
          height={'auto'}

          info={{ id: 'node-tree-view' }}

          data={nodeTreeViewData}
          focusedItem={focusedItem}
          selectedItems={selectedItems}
          expandedItems={expandedItems}

          renderers={{
            renderTreeContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItemsContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItem: (props) => {
              const htmlElementReferenceData = useMemo<THtmlElementsReference>(() => {
                const node = props.item.data as TNode
                const nodeData = node.data as THtmlNodeData
                const refData = htmlReferenceData.elements[nodeData.name === '!doctype' ? '!DOCTYPE' : nodeData.name]
                return refData
              }, [])

              return <>
                <li
                  className={cx(
                    props.context.isSelected && 'background-secondary',

                    props.context.isDraggingOver && '',
                    props.context.isDraggingOverParent && '',

                    props.context.isFocused && '',
                  )}
                  {...props.context.itemContainerWithChildrenProps}
                >
                  <div
                    id={`NodeTreeView-${props.item.index}`}
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      'outline-default',

                      props.context.isSelected && 'background-tertiary outline-none',
                      !props.context.isSelected && props.context.isFocused && 'outline',

                      props.context.isDraggingOver && 'outline',
                      props.context.isDraggingOverParent && '',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 18}px`,
                    }}
                    {...props.context.itemContainerWithoutChildrenProps}
                    {...props.context.interactiveElementProps}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()

                      !props.context.isFocused && addRunningActions(['nodeTreeView-focus'])
                      addRunningActions(['nodeTreeView-select'])

                      !props.context.isFocused && props.context.focusItem()

                      e.shiftKey ? props.context.selectUpTo() :
                        getCommandKey(e, osType) ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) :
                          (props.context.selectItem())

                      setActivePanel('node')

                      navigatorDropDownType !== null && setNavigatorDropDownType(null)
                    }}
                    onDoubleClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      openWebComponent(props.item.index as TNodeUid)
                    }}
                    onMouseEnter={(e) => {
                      const ele = e.target as HTMLElement
                      let _uid: TNodeUid | null = ele.getAttribute('id')
                      // for the elements which are created by js. (ex: Web Component)
                      let newHoveredElement: HTMLElement = ele
                      if (_uid === null || _uid === undefined) return
                      _uid = _uid?.substring(13, _uid.length)
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
                    }}
                    onMouseLeave={() => {
                      setFNHoveredItem('')
                    }}
                    onFocus={() => { }}
                    onDragStart={(e: React.DragEvent) => {
                      const img = new Image();
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setDragImage(img, window.outerWidth, window.outerHeight)
                      props.context.startDragging()

                      isDragging.current = true
                    }}
                    onDragEnter={(e) => {
                      if (!props.context.isExpanded) {
                        setTimeout(() => cb_expandNode(props.item.index as TNodeUid), AutoExpandDelay)
                      }
                      // e.dataTransfer.effectAllowed = 'move'
                      
                    }}
                  >
                    <div className="gap-s padding-xs" style={{ width: "100%" }}>
                      {props.arrow}

                      {htmlElementReferenceData ?
                        <SVGIconI {...{ "class": "icon-xs" }}>{htmlElementReferenceData['Icon']}</SVGIconI>
                        : props.item.data.name === "!--...--" || props.item.data.name === 'comment' ? <div className='icon-xs'><SVGIconI {...{ "class": "icon-xs" }}>bubble</SVGIconI></div> : <div className='icon-xs'><SVGIconI {...{ "class": "icon-xs" }}>component</SVGIconI></div>}

                      {htmlElementReferenceData ? <>
                        <span
                          className='text-s justify-stretch'
                          style={{
                            width: "calc(100% - 32px)",
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {htmlElementReferenceData['Name']}
                        </span>
                      </> : props.item.data.name === "!--...--" || props.item.data.name === 'comment' ? <span
                          className='text-s justify-stretch'
                          style={{
                            width: "calc(100% - 32px)",
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          comment
                        </span> : props.title}
                    </div>
                  </div>

                  {props.context.isExpanded ? <>
                    <div>
                      {props.children}
                    </div>
                  </> : null}
                </li>
              </>
            },
            renderItemArrow: (props) => {
              return <>
                {props.item.isFolder ?
                  (props.context.isExpanded ?
                    <SVGIconI {...{
                      "class": "icon-xs",
                      "onClick": (e: MouseEvent) => {
                        addRunningActions(['nodeTreeView-arrow'])
                        props.context.toggleExpandedState()
                      },
                    }}>down</SVGIconI> :
                    <SVGIconII {...{
                      "class": "icon-xs",
                      "onClick": (e: MouseEvent) => {
                        addRunningActions(['nodeTreeView-arrow'])
                        props.context.toggleExpandedState()
                      },
                    }}>right</SVGIconII>)
                  : <div className='icon-xs'></div>}
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span
                  className='text-s justify-stretch'
                  style={{
                    width: "calc(100% - 32px)",
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {props.title}
                </span>
              </>
            },
            renderDragBetweenLine: ({ draggingPosition, lineProps }) => (
              <div
                {...lineProps}
                className={'foreground-tertiary'}
                style={{
                  position: 'absolute',
                  right: '0',
                  top:
                    draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'top' ? '0px'
                      : draggingPosition.targetType === 'between-items' && draggingPosition.linePosition === 'bottom' ? '-2px'
                        : '-2px',
                  left: `${draggingPosition.depth * 10 + 20}px`,
                  height: '2px',
                }}
              />
            ),
          }}

          props={{
            canDragAndDrop: true,
            canDropOnFolder: true,
            canDropOnNonFolder: true,
            canReorderItems: true,

            canSearch: false,
            canSearchByStartingTyping: false,
            canRename: false,
          }}

          callbacks={{
            onSelectItems: (items) => {
              cb_selectNode(items as TNodeUid[])
            },
            onFocusItem: (item) => {
              cb_focusNode(item.index as TNodeUid)
            },
            onExpandItem: (item) => {
              cb_expandNode(item.index as TNodeUid)
            },
            onCollapseItem: (item) => {
              cb_collapseNode(item.index as TNodeUid)
            },
            onDrop: (items, target) => {
              const uids: TNodeUid[] = items.map(item => item.index as TNodeUid)
              const isBetween = target.targetType === 'between-items'
              const targetUid = (isBetween ? target.parentItem : target.targetItem) as TNodeUid
              const position = isBetween ? target.childIndex : 0

              cb_moveNode(uids, targetUid, isBetween, position)

              isDragging.current = false

              const className = 'dragging-tree';
              const html = document.getElementsByTagName('html').item(0);
              let body = (document.body as HTMLElement)
              body.classList.remove('inheritCursors');
              body.style.cursor = 'unset'
              if (html && new RegExp(className).test(html.className) === true) {
                  // Remove className with the added space (from setClassToHTMLElement)
                  
                  html.className = html.className.replace(
                      new RegExp(' ' + className),
                      ''
                  );
                  // Remove className without added space (just in case)
                  html.className = html.className.replace(new RegExp(className), '');
              }
            },
          }}
        />
      </div>
    </> : <></>
  }, [
    onPanelClick, showActionsPanel,
    nodeTreeViewData, file,
    focusedItem, selectedItems, expandedItems,
    addRunningActions, removeRunningActions,
    cb_selectNode, cb_focusNode, cb_expandNode, cb_collapseNode, cb_moveNode, parseFileFlag, setParseFile, navigatorDropDownType
  ])
}