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
  NodeUidSplitter,
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
  THtmlPageSettings,
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
      let onlyRenderViewState = false

      // parse file content
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
      let _nodeMaxUid = nodeMaxUid
      let _fileInfo: TFileInfo
      let _hasSameScript = true
      let _newFocusedNodeUid = ''

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

        _hasSameScript = false
      } else if (updateOpt.from === 'code') {
        if (fileData.type === 'html') {
          // detect seed node changed
          let seedNodeChanged = false
          for (const change of codeChanges) {
            const { uid } = change
            const node = _nodeTree[uid]
            if (uid === RootNodeUid || node.name === '!doctype' || node.name === 'head' || node.name === 'body') {
              seedNodeChanged = true
            }
          }
          if (seedNodeChanged) {
            const parserRes = parseFile(fileData.type, file.content, htmlReferenceData, osType)
            const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

            _nodeTree = tree
            _nodeMaxUid = Number(newNodeMaxUid)

            fileData.content = formattedContent
            fileData.contentInApp = contentInApp
            fileData.changed = fileData.content !== fileData.orgContent

            _hasSameScript = false
          } else {
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
          }
        } else {
          // do nothing
        }

        setCodeEditing(false)
      } else if (updateOpt.from === 'hms') {
        if (file.content === fileData.contentInApp) {
          // no need to build new node tree
          onlyRenderViewState = true
        } else {
          // parse hms content keeping node uids
          const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType, true, String(_nodeMaxUid) as TNodeUid)
          const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

          _nodeTree = tree
          _nodeMaxUid = Number(newNodeMaxUid)

          fileData.content = formattedContent
          fileData.contentInApp = contentInApp
          fileData.changed = fileData.content !== fileData.orgContent
        }

        _newFocusedNodeUid = focusedItem
      } else {
        // do nothing
      }

      // get file info from node tree
      if (fileData.type === 'html') {
        _fileInfo = {
          title: '',
          scripts: [],
          favicon: [],
        } as THtmlPageSettings
        // get html page settings
        Object.keys(_nodeTree).map(uid => {
          const node = _nodeTree[uid]
          const nodeData = node.data as THtmlNodeData
          if (nodeData.type === 'tag') {
            if (nodeData.name === 'title') {
              _fileInfo ? _fileInfo.title = node.uid : null
            } else if (nodeData.name === 'link' && nodeData.attribs.rel === 'icon' && nodeData.attribs.href) {
              _fileInfo && _fileInfo.favicon.push(nodeData.attribs.href)
            }
          } else if (nodeData.type === 'script') {
            _fileInfo && _fileInfo.scripts.push(node)
          }
        })
        // compare new file info with org file info
        if (_hasSameScript && fileInfo) {
          const _curScripts = _fileInfo.scripts
          const _orgScripts = fileInfo.scripts

          const curScripts: string[] = []
          const curScriptObj: { [uid: TNodeUid]: boolean } = {}
          _curScripts.map(script => {
            const attribs = (script.data as THtmlNodeData).attribs
            const uniqueStr = Object.keys(attribs)
              .filter(attrName => attrName !== NodeInAppAttribName)
              .sort((a, b) => a > b ? 1 : -1)
              .map(attrName => {
                return `${attrName}${NodeUidSplitter}${attribs[attrName]}`
              })
              .join(NodeUidSplitter)
            curScripts.push(uniqueStr)
            curScriptObj[uniqueStr] = true
          })

          const orgScripts: string[] = []
          const orgScriptObj: { [uid: string]: boolean } = {}
          _orgScripts.map(script => {
            const attribs = (script.data as THtmlNodeData).attribs
            const uniqueStr = Object.keys(attribs)
              .filter(attrName => attrName !== NodeInAppAttribName)
              .sort((a, b) => a > b ? 1 : -1)
              .map(attrName => {
                return `${attrName}${NodeUidSplitter}${attribs[attrName]}`
              })
              .join(NodeUidSplitter)
            orgScripts.push(uniqueStr)
            orgScriptObj[uniqueStr] = true
          })

          if (curScripts.length !== orgScripts.length) {
            _hasSameScript = false
          } else {
            for (const script of curScripts) {
              if (!orgScriptObj[script]) {
                _hasSameScript = false
                break
              }
            }
          }
        }
      } else {
        // do nothing
      }

      if (!onlyRenderViewState) {
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
        setNodeTree(_nodeTree)
        setNodeMaxUid(_nodeMaxUid)
        setFileInfo(_fileInfo)
        setHasSameScript(_hasSameScript)
        // update redux
        dispatch(setCurrentFileContent(fileData.contentInApp as string))
      }
      // select focused node in code view
      setNewFocusedNodeUid(_newFocusedNodeUid)

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

    addRunningActions(['processor-validNodeTree'])
    setValidNodeTree(_validNodeTree)

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])
  // processor-validNodeTree
  useEffect(() => {
    console.log('processor-validNodeTree')
    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(clearFNState())
      dispatch(expandFNNode(Object.keys(validNodeTree).slice(0, 50)))
      removeRunningActions(['processor-validNodeTree'])
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
      removeRunningActions(['processor-validNodeTree'])
    } else {
      removeRunningActions(['processor-validNodeTree'], false)
    }
  }, [validNodeTree])

  return useMemo(() => {
    return <></>
  }, [])
}