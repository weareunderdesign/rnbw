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
  AutoSave,
  FileAutoSaveInterval,
  LogAllow,
  RainbowAppName,
  RootNodeUid,
} from '@_constants/main';
import {
  parseFile,
  serializeFile,
} from '@_node/apis';
import {
  parseHtml,
  THtmlNodeData,
  THtmlParserResponse,
} from '@_node/html';
import { TNodeUid } from '@_node/types';
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
  setCurrentFileInfo,
} from '@_redux/main';
import { verifyFileHandlerPermission } from '@_services/main';

import { TFile } from '../../../types/main';
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
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  const isHms = useRef<boolean>(false)
  const isDoubleValidNodeTree = useRef<boolean>(false)

  // set rnbw app title and favicon from the current opened file
  useEffect(() => {
    if (file.info) {
      if (file.type === 'html') {
        // set title
        if (file.info.title) {
          const titleNode = nodeTree[file.info.title]
          const data = titleNode.data as THtmlNodeData
          const title = data.innerHtml
          window.document.title = title
        } else {
          window.document.title = RainbowAppName
        }

        // set favicon
        if (file.info.favicon.length) {
          LogAllow && console.log('favicon', file.info.favicon[0])
        } else {

        }
      }
    }
  }, [file.info])

  // content -> nodeTree
  useEffect(() => {
    if (updateOpt.parse !== true) {
      // update context files store
      if (openedFiles[file.uid]) {
        const _file: TFile = { ...openedFiles[file.uid], content: file.content, changed: openedFiles[file.uid].orgContent !== file.content }
        setOpenedFiles(_file)
      }
      return
    }

    if (updateOpt.parse === true && updateOpt.from === 'hms') {
      isHms.current = true
    }

    const parseResult = parseFile(file.type, file.content, htmlReferenceData, osType)
    setUpdateOpt({ parse: null, from: 'processor' })

    let newFileContent = '', newFileInfo: any = null, newFileInAppContent = ''
    if (file.type === 'html') {
      const { formattedContent, inAppContent, tree, info } = parseResult as THtmlParserResponse
      newFileContent = formattedContent
      newFileInAppContent = inAppContent
      newFileInfo = info
      setNodeTree(tree)
    } else {
      setNodeTree({})
    }

    setTimeout(() => {
      dispatch(setCurrentFileContent([newFileContent, newFileInAppContent]))
      dispatch(setCurrentFileInfo(newFileInfo))
    }, 0)

    // update context files store
    if (openedFiles[file.uid]) {
      const _file: TFile = { ...openedFiles[file.uid], content: newFileContent, info: newFileInfo, changed: openedFiles[file.uid].orgContent !== newFileContent }
      setOpenedFiles(_file)
    }

    removeRunningActions(['processor-content'])
  }, [file.uid, file.content])

  // nodeTree -> content
  useEffect(() => {
    if (updateOpt.parse !== false) return

    if (updateOpt.parse === false && updateOpt.from === 'node') {
      isDoubleValidNodeTree.current = true
    }

    const { content: newContent, inAppContent } = serializeFile(file.type, nodeTree, htmlReferenceData)
    setUpdateOpt({ parse: null, from: 'processor' })
    let newInfo: any = null

    if (file.type === 'html') {
      const { formattedContent, inAppContent, tree, info } = parseHtml(newContent, htmlReferenceData, osType)
      newInfo = info
      setNodeTree(tree)
    } else {
      setNodeTree({})
    }

    setTimeout(() => {
      dispatch(setCurrentFileContent([newContent, inAppContent]))
      dispatch(setCurrentFileInfo(newInfo))
    }, 0)

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])

  // validNodeTree -> validate fn tree view state
  useEffect(() => {
    // skip if it's hms
    if (isHms.current === true) {
      isHms.current = false
      return
    }

    if (updateOpt.parse === null && updateOpt.from === 'file') {
      dispatch(expandFNNode(Object.keys(validNodeTree)))
    } else {
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
    }

    if (isDoubleValidNodeTree.current === true) {
      isDoubleValidNodeTree.current = false
      return
    }

    setTimeout(() => removeRunningActions(['processor-validNodeTree']), 0)
  }, [validNodeTree])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // auto-save with debounce
  const fsTimeout = useRef<NodeJS.Timeout | null>(null)
  const saveFileContentToFs = useCallback(async () => {
    setPending(true)

    // get the current file handler
    let handler = ffHandlers[file.uid]
    if (handler === undefined) {
      fsTimeout.current = null
      setPending(false)
      return
    }

    // verify permission
    if (await verifyFileHandlerPermission(handler) === false) {
      addMessage({
        type: 'error',
        content: 'auto save failed cause of invalid handler',
      })
      fsTimeout.current = null
      setPending(false)
      return
    }

    // update file content
    try {
      const writableStream = await (handler as FileSystemFileHandle).createWritable()
      await writableStream.write(file.content)
      await writableStream.close()

      addMessage({
        type: 'success',
        content: 'Saved successfully',
      })

      // update context files store
      const _file: TFile = { ...openedFiles[file.uid], orgContent: file.content, content: file.content, changed: false }
      setOpenedFiles(_file)
    } catch (err) {
      addMessage({
        type: 'error',
        content: 'error occurred while auto-saving',
      })
    }

    fsTimeout.current = null
    setPending(false)
  }, [openedFiles, setOpenedFiles, ffHandlers, file.uid, file.content])

  // set Auto-Save
  useEffect(() => {
    if (!AutoSave) return

    fsTimeout.current !== null && clearTimeout(fsTimeout.current)
    fsTimeout.current = setTimeout(saveFileContentToFs, FileAutoSaveInterval)
  }, [file.content])

  // do actions
  useEffect(() => {
    // cmdk actions handle
    switch (currentCommand.action) {
      case 'Save':
        // saveFileContentToFs()
        break
      default:
        break
    }
  }, [currentCommand.changed])

  return <></>
}