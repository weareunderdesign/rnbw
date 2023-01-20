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

import * as config from '@_config/main';
import {
  parseFile,
  serializeFile,
} from '@_node/apis';
import {
  parseHtml,
  THtmlParserResponse,
} from '@_node/html';
import { TUid } from '@_node/types';
import {
  clearFNState,
  expandFNNode,
  fnSelector,
  focusFNNode,
  globalSelector,
  MainContext,
  selectFNNode,
  updateFileContent,
} from '@_redux/main';
import { verifyPermission } from '@_services/main';

import { ProcessProps } from './types';

export default function Process(props: ProcessProps) {
  const dispatch = useDispatch()

  // main context
  const {
    addRunningActions, removeRunningActions,
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,
    updateOpt, setUpdateOpt,
    currentCommand, setCurrentCommand,
    pending, setPending, messages, addMessage, removeMessage,
  } = useContext(MainContext)

  // redux state
  const { project, currentFile, action } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  const isHms = useRef<boolean>(false)
  const isDoubleValidNodeTree = useRef<boolean>(false)

  // content -> nodeTree
  useEffect(() => {
    // console.log('processor-content', updateOpt)

    if (updateOpt.parse !== true) return

    if (updateOpt.parse === true && updateOpt.from === 'hms') {
      isHms.current = true
    }

    const parseResult = parseFile({ type: currentFile.type, content: currentFile.content })
    setUpdateOpt({ parse: null, from: 'processor' })

    if (currentFile.type === 'html') {
      const { content: formattedContent, tree } = parseResult as THtmlParserResponse
      setNodeTree(tree)
      setTimeout(() => dispatch(updateFileContent(formattedContent)), 0)
    } else {
      setNodeTree({})
    }

    removeRunningActions(['processor-content'])
  }, [currentFile.uid, currentFile.content])

  // nodeTree -> content
  useEffect(() => {
    // console.log('processor-nodeTree', updateOpt)

    if (updateOpt.parse !== false) return

    if (updateOpt.parse === false && updateOpt.from === 'node') {
      isDoubleValidNodeTree.current = true
    }

    const newContent = serializeFile({ type: currentFile.type, tree: nodeTree })
    setUpdateOpt({ parse: null, from: 'processor' })

    if (currentFile.type === 'html') {
      const { content: formattedContent, tree } = parseHtml(newContent)
      setNodeTree(tree)
    }

    setTimeout(() => dispatch(updateFileContent(newContent)), 0)

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])

  // validNodeTree -> validate fn tree view state
  useEffect(() => {
    // skip if it's hms
    if (isHms.current === true) {
      isHms.current = false
      return
    }

    if (updateOpt.parse === null && updateOpt.from === 'fs') {
      dispatch(expandFNNode(Object.keys(validNodeTree)))
    } else {
      const _focusedItem: TUid = validNodeTree[focusedItem] === undefined ? 'ROOT' : focusedItem
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
    let handler = ffHandlers[currentFile.uid]
    if (handler === undefined) {
      fsTimeout.current = null
      return
    }

    // verify permission
    if (await verifyPermission(handler) === false) {
      addMessage({
        type: 'error',
        message: 'auto save failed cause of invalid handler',
      })
      fsTimeout.current = null
      return
    }

    console.log('processor-save')

    // update file content
    try {
      const writableStream = await (handler as FileSystemFileHandle).createWritable()
      await writableStream.write(currentFile.content)
      await writableStream.close()

      addMessage({
        type: 'success',
        message: 'Saved successfully',
      })
    } catch (err) {
      addMessage({
        type: 'error',
        message: 'error occurred while auto-saving',
      })
    }

    fsTimeout.current = null

    setPending(false)
  }, [ffHandlers, currentFile.uid, currentFile.content])
  useEffect(() => {
    fsTimeout.current !== null && clearTimeout(fsTimeout.current)
    return
    fsTimeout.current = setTimeout(saveFileContentToFs, config.FileAutoSaveInterval)
  }, [currentFile.content])

  // do actions
  useEffect(() => {
    // cmdk actions handle
    switch (currentCommand.action) {
      case 'save':
        saveFileContentToFs()
        break
      default:
        break
    }
  }, [currentCommand.changed])

  return <></>
}