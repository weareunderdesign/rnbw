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

import {
  NodeInAppAttribName,
  NodeUidSplitter,
  RainbowAppName,
  RootNodeUid,
} from '@_constants/main';
import {
  getNodeEntryName,
  parseFile,
  serializeFile,
  sortNodeUidsByBfs,
} from '@_node/apis';
import { THtmlParserResponse } from '@_node/html';
import {
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
  setCurrentFile,
} from '@_redux/main';

import {
  TFileInfo,
  TFileType,
} from '../../../types/main';
import { ProcessProps } from './types';

export default function Process(props: ProcessProps) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    openedFiles, setOpenedFiles, removeOpenedFiles,
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

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
    fileInfo, setFileInfo,
    hasSameScript, setHasSameScript,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // set app title and favicon
  useEffect(() => {
    if (file.type === 'html') {
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
    }
  }, [file.info])

  const getReferenceData = useCallback((fileType: TFileType) => {
    return fileType === 'html' ? htmlReferenceData : htmlReferenceData
  }, [htmlReferenceData])

  // processor-file
  const orgFileUid = useRef<TNodeUid>('')
  useEffect(() => {
    if (file.uid === '') return

    let _fileInfo: TFileInfo = null

    if (updateOpt.parse === true && updateOpt.from === 'file') {
      const _file = JSON.parse(JSON.stringify(file))
      let _tree: TNodeTreeData = {}

      const parsedRes = parseFile(_file.type, _file.content, getReferenceData(_file.type), osType)
      if (_file.type === 'html') {
        const { formattedContent, tree, info } = parsedRes as THtmlParserResponse
        _fileInfo = info
        _file.content = formattedContent
        _file.changed = formattedContent !== _file.orgContent
        _tree = tree
        _file.info = info
      } else {
        // do nothing
      }

      addRunningActions(['processor-nodeTree'])
      setNodeTree(_tree)

      setUpdateOpt({ parse: null, from: 'file' })
      setTimeout(() => dispatch(setCurrentFile(_file)), 0)

      setOpenedFiles(_file)
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

      setOpenedFiles(_file)
    } else if (updateOpt.parse === true && updateOpt.from === 'code') {
      const _file = JSON.parse(JSON.stringify(file))
      let _tree: TNodeTreeData = {}

      const parsedRes = parseFile(_file.type, _file.content, getReferenceData(_file.type), osType)
      if (_file.type === 'html') {
        const { formattedContent, tree, info } = parsedRes as THtmlParserResponse
        _fileInfo = info
        _file.content = formattedContent
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

      setOpenedFiles(_file)
    } else {
      // do nothing
    }

    if (updateOpt.parse === true) {
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
          const attribs = script.data.attribs
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
          const attribs = script.data.attribs
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
    }

    orgFileUid.current = file.uid

    removeRunningActions(['processor-file'])
  }, [file.uid, file.content])

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

    if (updateOpt.parse === false && updateOpt.from === 'node') {
      const _file = JSON.parse(JSON.stringify(file))

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
    }

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])

  // processor-validNodeTree
  useEffect(() => {
    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(clearFNState())
      // dispatch(expandFNNode(Object.keys(validNodeTree)))
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