import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  NodeInAppAttribName,
  RainbowAppName,
  RootNodeUid,
} from '@_constants/main';
import { getSubNodeUidsByBfs } from '@_node/apis';
import {
  parseFile,
  serializeFile,
  TFileNodeData,
  writeFile,
} from '@_node/file';
import {
  parseHtmlCodePart,
  serializeHtml,
  THtmlNodeData,
} from '@_node/html';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import {
  clearFNState,
  expandFNNode,
  fnSelector,
  focusFNNode,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
  setCurrentFileContent,
} from '@_redux/main';
import {
  TFileInfo,
  TFileType,
} from '@_types/main';

import { ProcessProps } from './types';

export default function Process(props: ProcessProps) {
  const dispatch = useDispatch()

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // main context
  const {
    newFocusedNodeUid, setNewFocusedNodeUid,
    codeChanges, setEvent,
    fsPending, setFSPending,
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, setFFNode,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, nodeMaxUid, setNodeMaxUid,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms: _isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    addMessage, removeMessage, codeEditing, setCodeEditing,

    // reference
    htmlReferenceData, cmdkReferenceData,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // stage-view
    setIFrameSrc,
    fileInfo, setFileInfo,
    hasSameScript, setHasSameScript,
  } = useContext(MainContext)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // service - get reference data for current file type
  const getReferenceData = useCallback((fileType: TFileType) => {
    return fileType === 'html' ? htmlReferenceData : htmlReferenceData
  }, [htmlReferenceData])
  // set app title
  useEffect(() => {
    if (file.uid === '') {
      window.document.title = RainbowAppName
    } else {
      const _file = ffTree[file.uid]
      const fileData = _file.data as TFileNodeData
      window.document.title = `${fileData.name}${fileData.ext}`
    }
  }, [fileInfo])
  // processor-updateOpt
  useEffect(() => {
    if (updateOpt.parse === true) {
      // parse file content
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
      let _nodeMaxUid = nodeMaxUid

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'file') {
        const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType)
        const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

        _nodeTree = tree
        _nodeMaxUid = Number(newNodeMaxUid)

        fileData.content = formattedContent
        fileData.contentInApp = contentInApp
        fileData.changed = fileData.content !== fileData.orgContent
      } else if (updateOpt.from === 'code') {
        if (fileData.type === 'html') {
          if (codeChanges[0].uid === RootNodeUid) {
            // do nothing for now
          } else {
            let _newFocusedNodeUid = ''

            // side effects
            codeChanges.map(codeChange => {
              // ---------------------- node tree side effect ----------------------
              // parse code part
              const parserRes = parseHtmlCodePart(codeChange.content, htmlReferenceData, osType, String(_nodeMaxUid) as TNodeUid)
              const { formattedContent, tree, nodeMaxUid: newNodeMaxUid } = parserRes
              _nodeMaxUid = Number(newNodeMaxUid)
              // remove org nodes
              const o_node = _nodeTree[codeChange.uid]
              const o_parentNode = _nodeTree[o_node.parentUid as TNodeUid]
              o_parentNode.children = o_parentNode.children.reduce((prev, cur) => {
                if (cur === codeChange.uid) {
                  prev.push(tree[RootNodeUid].children[0])
                } else {
                  prev.push(cur)
                }
                return prev
              }, [] as TNodeUid[])
              const o_uids = getSubNodeUidsByBfs(codeChange.uid, _nodeTree)
              o_uids.map(uid => {
                delete _nodeTree[uid]
              })
              // add new nodes / get valid node's uid list for iframe
              const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false)
              const nodeUids: TNodeUid[] = []
              uids.map(uid => {
                const node = tree[uid]
                if (node.parentUid === RootNodeUid) {
                  _newFocusedNodeUid = uid
                  node.parentUid = o_parentNode.uid
                }
                _nodeTree[uid] = JSON.parse(JSON.stringify(node))
                const nodeData = node.data as THtmlNodeData
                nodeData.valid && nodeUids.push(uid)
              })
              // ---------------------- iframe side effect ----------------------
              // build element to replace
              let nodeUidIndex = -1
              const divElement = document.createElement('div')
              divElement.innerHTML = formattedContent
              const nodes: Node[] = [divElement.childNodes[0]]
              while (nodes.length) {
                const node = nodes.shift() as Node
                if (node.nodeName === '#text') continue

                (node as HTMLElement).setAttribute(NodeInAppAttribName, nodeUids[++nodeUidIndex])
                node.childNodes.forEach((childNode) => {
                  nodes.push(childNode)
                })
              }
              // replace element to iframe
              const element = document.querySelector('iframe')?.contentWindow?.window.document.querySelector(`[${NodeInAppAttribName}="${codeChange.uid}"]`)
              element?.parentElement?.insertBefore(divElement.childNodes[0], element.nextSibling)
              element?.remove()
            })
            // rebuild from new tree
            const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(_nodeTree, htmlReferenceData, osType)
            fileData.content = formattedContent
            fileData.contentInApp = contentInApp
            fileData.changed = fileData.content !== fileData.orgContent

            setNewFocusedNodeUid(_newFocusedNodeUid)
          }
        } else {
          // do nothing
        }

        setCodeEditing(false)
      } else if (updateOpt.from === 'hms') {
      } else {
        // do nothing
      }

      // update idb
      setFSPending(true)
      writeFile(fileData.path, fileData.contentInApp as string, () => {
        if (fileData.type === 'html') {
          setIFrameSrc(`rnbw${fileData.path}`)
        } else {
          // do nothing
        }
        setFSPending(false)
      })
      // update context
      setFFNode(_file)
      addRunningActions(['processor-nodeTree'])
      console.log(_nodeTree, _nodeMaxUid)
      setNodeTree(_nodeTree)
      setNodeMaxUid(_nodeMaxUid)
      // update redux
      dispatch(setCurrentFileContent(fileData.contentInApp as string))

      setUpdateOpt({ parse: null, from: updateOpt.from })
    } else if (updateOpt.parse === false) {
      // serialize node tree data
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'node') {
        const serializedRes = serializeFile(fileData.type, _nodeTree, getReferenceData(fileData.type), osType)

        if (fileData.type === 'html') {
          const { html, htmlInApp } = serializedRes as THtmlNodeData
          // update ffTree
          fileData.content = html
          fileData.contentInApp = htmlInApp
          fileData.changed = fileData.content !== fileData.orgContent
        } else {
          // do nothing
        }
      }

      // update idb
      setFSPending(true)
      writeFile(fileData.path, fileData.contentInApp as string, () => {
        setFSPending(false)
      })
      // update context
      setFFNode(_file)
      addRunningActions(['processor-nodeTree'])
      setNodeTree(_nodeTree)
      // update redux
      dispatch(setCurrentFileContent(fileData.contentInApp as string))

      setUpdateOpt({ parse: null, from: updateOpt.from })
    } else {
      // do nothing
    }

    removeRunningActions(['processor-updateOpt'])
  }, [updateOpt])
  // processor-nodeTree
  useEffect(() => {
    if (!nodeTree[RootNodeUid]) return

    const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
    const _validNodeTree: TNodeTreeData = {}

    // build valid node tree
    const uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree)
    uids.reverse()
    uids.map((uid) => {
      const node = _nodeTree[uid]
      if (!node.data.valid) return

      node.children = node.children.filter((c_uid) => _nodeTree[c_uid].data.valid)
      node.isEntity = node.children.length === 0
      _validNodeTree[uid] = node
    })

    // get file info
    const _fileInfo: TFileInfo = {
      scripts: [],
      favicon: [],
    }

    addRunningActions(['processor-validNodeTree'])
    setValidNodeTree(_validNodeTree)

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])
  // processor-validNodeTree
  useEffect(() => {
    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(clearFNState())
      dispatch(expandFNNode(Object.keys(validNodeTree).slice(0, 50)))
    } else if (updateOpt.parse === null && updateOpt.from === 'code') {
      const _focusedItem: TNodeUid = validNodeTree[focusedItem] === undefined ? newFocusedNodeUid : focusedItem
      const _expandedItems = expandedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined && validNodeTree[uid].isEntity === false
      })
      const _selectedItems = selectedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined
      })
      dispatch(clearFNState())
      dispatch(focusFNNode(_focusedItem))
      dispatch(expandFNNode(_expandedItems))
      dispatch(selectFNNode(_selectedItems))
    } else {
      // do nothing
    }

    removeRunningActions(['processor-validNodeTree'])
  }, [validNodeTree])

  return useMemo(() => {
    return <></>
  }, [])
}