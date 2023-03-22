import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  getSubNodeUidsByBfs,
  getSubNodeUidsByDfs,
} from '@_node/apis';
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
import { getLineBreakCharacter } from '@_services/global';
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
    pending, setPending, messages, addMessage, removeMessage, codeEditing, setCodeEditing,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // stage-view
    setIframeSrc,
    fileInfo, setFileInfo,
    hasSameScript, setHasSameScript,
  } = useContext(MainContext)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
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

  const getReferenceData = useCallback((fileType: TFileType) => {
    return fileType === 'html' ? htmlReferenceData : htmlReferenceData
  }, [htmlReferenceData])

  // processor-updateOpt
  const orgFileUid = useRef<TNodeUid>('')
  useEffect(() => {
    // parse file content
    if (updateOpt.parse === true) {
      let _fileInfo: TFileInfo = null
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
      let _nodeMaxUid = nodeMaxUid

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'file') {
        const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType)
        const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid, info } = parserRes

        _fileInfo = info
        _nodeTree = tree
        fileData.content = formattedContent
        fileData.contentInApp = contentInApp
        fileData.changed = fileData.content !== fileData.orgContent

        writeFile(fileData.path, contentInApp, () => {
          if (fileData.type === 'html') {
            setIframeSrc(`rnbw${fileData.path}`)
          } else {
            // do nothing
          }
        })

        _nodeMaxUid = Number(newNodeMaxUid)
      } else if (updateOpt.from === 'hms') {
        // do nothing
      } else if (updateOpt.from === 'code') {
        if (fileData.type === 'html') {
          if (codeChanges[0].uid === RootNodeUid) {
            // do nothing for now
          } else {
            codeChanges.map(codeChange => {
              // ----------- node tree side effect -----------
              // parse code part
              const parserRes = parseHtmlCodePart(codeChange.content, htmlReferenceData, osType, String(_nodeMaxUid) as TNodeUid)
              const { formattedContent, tree, nodeMaxUid: newNodeMaxUid } = parserRes
              _nodeMaxUid = Number(newNodeMaxUid)

              // remove org nodes
              const o_node = _nodeTree[codeChange.uid]
              const o_parentNode = _nodeTree[o_node.parentUid as TNodeUid]
              const o_uids = getSubNodeUidsByBfs(codeChange.uid, _nodeTree)
              o_parentNode.children = o_parentNode.children.reduce((prev, cur) => {
                if (cur === codeChange.uid) {
                  prev.push(tree[RootNodeUid].children[0])
                } else {
                  prev.push(cur)
                }
                return prev
              }, [] as TNodeUid[])
              o_uids.map(uid => {
                delete _nodeTree[uid]
              })
              // add new nodes / get valid node's uid list for iframe
              const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false)
              const nodeUids: TNodeUid[] = []
              uids.map(uid => {
                _nodeTree[uid] = JSON.parse(JSON.stringify(tree[uid]))
                const node = tree[uid]
                const nodeData = node.data as THtmlNodeData
                nodeData.valid && nodeUids.push(uid)
              })

              // ----------- iframe side effect -----------
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
              element && element?.parentElement?.insertBefore(divElement.childNodes[0], element?.nextSibling)
              element?.remove()
            })

            // update file / set html, htmlInApp, code range for the new node tree
            const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(_nodeTree, htmlReferenceData)
            fileData.content = formattedContent
            fileData.contentInApp = contentInApp
            fileData.changed = fileData.content !== fileData.orgContent
            writeFile(fileData.path, contentInApp, () => {
              // wrote file content
            })

            const detected: Map<string, number> = new Map<string, number>()
            const uids = getSubNodeUidsByDfs(RootNodeUid, _nodeTree)
            uids.map((uid) => {
              const node = _nodeTree[uid]
              if (!node.data.valid) return

              const { html } = node.data as THtmlNodeData
              const htmlArr = formattedContent.split(html)

              const detectedCount = detected.get(html) || 0
              const beforeHtml = htmlArr.slice(0, detectedCount + 1).join(html)
              detected.set(html, detectedCount + 1)

              const beforeHtmlArr = beforeHtml.split(getLineBreakCharacter(osType))
              const startLineNumber = beforeHtmlArr.length
              const startColumn = (beforeHtmlArr.pop()?.length || 0) + 1

              const contentArr = html.split(getLineBreakCharacter(osType))
              const endLineNumber = startLineNumber + contentArr.length - 1
              const endColumn = (contentArr.length === 1 ? startColumn : 1) + (contentArr.pop()?.length || 0)

              node.data = {
                ...node.data,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
              }
            })

            console.log(contentInApp, _nodeTree, _nodeMaxUid, _file)
          }
        } else {
          // do nothing
        }

        setCodeEditing(false)
      } else {
        // do nothing
      }

      setFFNode(_file)
      setFileInfo(_fileInfo)
      dispatch(setCurrentFileContent(fileData.content))

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_nodeTree)
      setNodeMaxUid(_nodeMaxUid)

      setUpdateOpt({ parse: null, from: updateOpt.from })

      orgFileUid.current = file.uid

      // check if the script list changed ----- tmp code
      /* let _hasSameScript = true
      if (fileInfo === null || file.uid !== orgFileUid.current) {
        _hasSameScript = false
      } else {
        const _curScripts = !_fileInfo ? [] : _fileInfo.scripts
        const _orgScripts = fileInfo.scripts

        const curScripts: string[] = []
        const curScriptObj: { [uid: string]: boolean } = {}
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
      setHasSameScript(_hasSameScript) */
    }

    // serialize tree data
    if (updateOpt.parse === false) {
      let _fileInfo: TFileInfo = null
      let _nodeTree: TNodeTreeData = {}
      let _nodeMaxUid: TNodeUid = ''

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'node') {
        const serializedRes = serializeFile(fileData.type, nodeTree, getReferenceData(fileData.type))

        if (fileData.type === 'html') {
          const { html, htmlInApp } = serializedRes as THtmlNodeData
          fileData.content = html
          fileData.contentInApp = htmlInApp
          fileData.changed = fileData.content !== fileData.orgContent

          setFSPending(true)
          writeFile(fileData.path, htmlInApp, () => {
            setFSPending(false)
          })

          // need to build html, htmlInApp and code range
          const parserRes = parseFile(fileData.type, htmlInApp, getReferenceData(fileData.type), osType, true, String(nodeMaxUid) as TNodeUid)
          const { tree, info, nodeMaxUid: newNodeMaxUid } = parserRes
          _fileInfo = info
          _nodeTree = tree
          _nodeMaxUid = newNodeMaxUid
        } else {
          // do nothing
        }
      }

      setFFNode(_file)
      setFileInfo(_fileInfo)
      setNodeTree(_nodeTree)
      setNodeMaxUid(Number(_nodeMaxUid))
      dispatch(setCurrentFileContent(fileData.contentInApp as string))

      setUpdateOpt({ parse: null, from: updateOpt.from })
    }

    removeRunningActions(['processor-updateOpt'])
  }, [updateOpt])

  // processor-nodeTree
  useEffect(() => {
    // validate
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
    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(clearFNState())
      dispatch(expandFNNode(Object.keys(validNodeTree).slice(0, 50)))
    } else if (updateOpt.parse === null && updateOpt.from === 'code') {
      const _focusedItem: TNodeUid = validNodeTree[focusedItem] === undefined ? RootNodeUid : focusedItem
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
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  return useMemo(() => {
    return <></>
  }, [])
}