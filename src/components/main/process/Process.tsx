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
    pending, setPending, messages, addMessage, removeMessage,

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
      let _nodeTree: TNodeTreeData = {}

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'file' || updateOpt.from === 'hms' || updateOpt.from === 'code') {
        const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType)
        const { formattedContent, contentInApp, tree, nodeMaxUid, info } = parserRes

        _fileInfo = info
        _nodeTree = tree
        fileData.content = formattedContent
        fileData.contentInApp = contentInApp
        fileData.changed = fileData.content !== fileData.orgContent

        if (fileData.type === 'html') {
          writeFile(fileData.path, contentInApp, () => {
            setIframeSrc(`rnbw${fileData.path}`)
          })
        } else {
          // do nothing
        }

        if (updateOpt.from === 'file') {
          setNodeMaxUid(Number(nodeMaxUid))
        }
      }

      setFFNode(_file)
      setFileInfo(_fileInfo)
      dispatch(setCurrentFileContent(fileData.content))

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_nodeTree)

      setUpdateOpt({ parse: null, from: updateOpt.from })

      orgFileUid.current = file.uid

      /* if (updateOpt.parse === true) {
        // check if the script list changed
        let _hasSameScript = true
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
        setHasSameScript(_hasSameScript)
        setFileInfo(_fileInfo)
      } */
    }

    // serialize tree data
    if (updateOpt.parse === false) {
      let _fileInfo: TFileInfo = null
      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'node') {
        const newFileContent = serializeFile(fileData.type, nodeTree, getReferenceData(fileData.type))
        const parserRes = parseFile(fileData.type, newFileContent, getReferenceData(fileData.type), osType)
        const { formattedContent, contentInApp, tree, nodeMaxUid, info } = parserRes

        _fileInfo = info
        fileData.content = formattedContent
        fileData.contentInApp = contentInApp
        fileData.changed = fileData.content !== fileData.orgContent

        if (fileData.type === 'html') {
          writeFile(fileData.path, contentInApp, () => {
            setIframeSrc(`rnbw${fileData.path}`)
          })
        } else {
          // do nothing
        }
      }

      setFFNode(_file)
      setFileInfo(_fileInfo)
      dispatch(setCurrentFileContent(fileData.content))

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
      dispatch(expandFNNode(Object.keys(validNodeTree)/* .slice(0, 50) */))
      removeRunningActions(['processor-validNodeTree'])
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

      setTimeout(() => removeRunningActions(['processor-validNodeTree']), 0)
    } else {
      removeRunningActions(['processor-validNodeTree'], false)
    }
  }, [validNodeTree])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  return useMemo(() => {
    return <></>
  }, [])
}