import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { RootNodeUid } from '@_constants/main';
import {
  parseFile,
  sortNodeUidsByBfs,
} from '@_node/apis';
import {
  TFileNodeData,
  writeFile,
} from '@_node/file';
import { THtmlParserResponse } from '@_node/html';
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
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

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
  // set app title and favicon
  useEffect(() => {
    /* if (file.type === 'html') {
      // set title
      window.document.title = getNodeEntryName(file.uid)

      // set favicon
      if (file.info && file.info.favicon.length) {
        // const favicon = file.info.favicon[0]
      } else {
        // no favion
      }
    } else {
      window.document.title = RainbowAppName
    } */
  }, [fileInfo])

  const getReferenceData = useCallback((fileType: TFileType) => {
    return fileType === 'html' ? htmlReferenceData : htmlReferenceData
  }, [htmlReferenceData])

  // processor-file
  const orgFileUid = useRef<TNodeUid>('')
  useEffect(() => {
    // parse from file content
    if (updateOpt.parse === true) {
      let _fileInfo: TFileInfo = null
      let _nodeTree: TNodeTreeData = {}

      // read file
      if (updateOpt.from === 'file') {
        const node = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
        const nodeData = node.data as TFileNodeData

        const parsedRes = parseFile(nodeData.type, nodeData.content, getReferenceData(nodeData.type), osType)
        if (nodeData.type === 'html') {
          const { formattedContent, contentInApp, tree, info } = parsedRes as THtmlParserResponse
          _fileInfo = info
          _nodeTree = tree
          nodeData.content = formattedContent
          nodeData.contentInApp = contentInApp
          nodeData.changed = nodeData.content !== nodeData.orgContent
          writeFile(nodeData.path, contentInApp, () => {
            setIframeSrc(`rnbw${nodeData.path}`)
          })
        } else {
          // do nothing
        }

        setFileInfo(_fileInfo)

        addRunningActions(['processor-nodeTree'])
        setNodeTree(_nodeTree)

        setUpdateOpt({ parse: null, from: 'file' })
      }
    }

    // serialize from node tree data
    if (updateOpt.parse === false) {

    }



    /* if (updateOpt.parse === true && updateOpt.from === 'file') {
      const node = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const nodeData = node.data as TFileNodeData
      console.log(nodeData)

      const parsedRes = parseFile(nodeData.type, nodeData.content, getReferenceData(nodeData.type), osType)
      if (nodeData.type === 'html') {
        const { formattedContent, contentInApp, tree, info } = parsedRes as THtmlParserResponse
        _tree = tree
        _fileInfo = info
        nodeData.content = formattedContent
        nodeData.contentInApp = contentInApp
        writeFile(nodeData.path, contentInApp)
        setHasSameScript(true)
      } else {
        // do nothing
      }

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_tree)
    } else if (updateOpt.parse === true && updateOpt.from === 'hms') {
      const _file = JSON.parse(JSON.stringify(file))
      _fileInfo = _file.info
      let _tree: TNodeTreeData = {}

      const parsedRes = parseFile(_file.type, _file.content, getReferenceData(_file.type), osType)
      if (_file.type === 'html') {
        const { tree } = parsedRes as THtmlParserResponse
        _tree = tree
      } else {
        // do nothing
      }

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_tree)
    } else if (updateOpt.parse === true && updateOpt.from === 'code') {
      const _file = JSON.parse(JSON.stringify(file))
      let _tree: TNodeTreeData = {}

      const parsedRes = parseFile(_file.type, _file.content, getReferenceData(_file.type), osType)
      if (_file.type === 'html') {
        const { formattedContent, contentInApp, tree, info } = parsedRes as THtmlParserResponse
        _fileInfo = info
        _file.content = formattedContent
        _file.contentInApp = contentInApp
        _file.changed = formattedContent !== _file.orgContent
        _tree = tree
        _file.info = info
      } else {
        // do nothing
      }

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_tree)

      setUpdateOpt({ parse: null, from: 'code' })
      setTimeout(() => dispatch(setCurrentFile(_file)), 0)
    } else {
      // do nothing
    } */

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

    orgFileUid.current = file.uid

    removeRunningActions(['processor-file'])
  }, [updateOpt])

  // processor-nodeTree
  useEffect(() => {
    const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
    const _validNodeTree: TNodeTreeData = {}

    let uids: TNodeUid[] = Object.keys(_nodeTree)
    uids = sortNodeUidsByBfs(uids)
    uids.reverse()
    uids.map((uid) => {
      const node = _nodeTree[uid]

      // validate
      if (node.children.length !== 0) {
        node.children = node.children.filter((c_uid) => {
          return _nodeTree[c_uid].data.valid
        })
        node.isEntity = (node.children.length === 0)
      }

      // add only validated node
      node.data.valid ? _validNodeTree[uid] = node : null
    })

    addRunningActions(['processor-validNodeTree'])
    setValidNodeTree(_validNodeTree)

    /* if (updateOpt.parse === false && updateOpt.from === 'node') {
      const _file = JSON.parse(JSON.stringify(file)) as TFile

      const newFileContent = serializeFile(file.type, nodeTree, getReferenceData(file.type))
      _file.content = newFileContent
      if (newFileContent !== _file.orgContent) {
        _file.changed = true
      }

      const parsedRes = parseFile(_file.type, newFileContent, getReferenceData(_file.type), osType)
      if (_file.type === 'html') {
        const { info } = parsedRes as THtmlParserResponse
        _file.info = info
      } else {
        // do nothing
      }

      setUpdateOpt({ parse: null, from: 'node' })
      setTimeout(() => dispatch(setCurrentFile(_file)), 0)

      setOpenedFiles(_file)
    } else {
      // do nothing
    } */

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])

  // processor-validNodeTree
  useEffect(() => {
    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(clearFNState())
      dispatch(expandFNNode(Object.keys(validNodeTree).slice(0, 50)))
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

  return <></>
}