import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import * as monaco from 'monaco-editor';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import * as config from '@_config/main';
import { getBfsUids } from '@_node/apis';
import { TUid } from '@_node/types';
import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';
import { verifyPermission } from '@_services/main';
import Editor, {
  loader,
  Monaco,
} from '@monaco-editor/react';

import { CodeViewProps } from './types';

loader.config({ monaco })

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch()

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningAction = (actionNames: string[]) => {
    for (const actionName of actionNames) {
      runningActions.current[actionName] = true
    }
  }
  const removeRunningAction = (actionNames: string[], effect: boolean = true) => {
    for (const actionName of actionNames) {
      delete runningActions.current[actionName]
    }
    if (effect && noRunningAction()) {
      dispatch(Main.increaseActionGroupIndex())
    }
  }

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree: treeData, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { workspace, openedFiles, currentFile: { uid: currentFileUid, content }, pending, messages } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // Monaco Instance Ref
  const monacoRef = useRef<monaco.editor.IEditor | null>(null)
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor
  }

  // monaco-editor options - tabSize, wordWrap
  const [tabSize, setTabSize] = useState<number>(4)
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const toogleWrap = () => setWordWrap(wordWrap === 'on' ? 'off' : 'on')

  // sync with the redux
  const _focusedItem = useRef<TUid>(focusedItem)
  const contentRef = useRef<string>(content)
  const syncWithNodeTreeView = useRef<boolean>(true)
  useEffect(() => {
    syncWithNodeTreeView.current = true

    if (contentRef.current === content) return
    contentRef.current = content
  }, [content])

  // select html code in code view based on the view state in nodeTreeView&StageView
  useEffect(() => {
    if (_focusedItem.current === focusedItem) return
    _focusedItem.current = focusedItem

    if (monacoRef.current === null) return

    let node = treeData[focusedItem]
    if (node === undefined) return

    const { startLineNumber, startColumn, endLineNumber, endColumn } = node.data

    const editor = monacoRef.current as monaco.editor.IEditor
    editor.setSelection({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    })
    // editor.revealRangeInCenter({
    //   startLineNumber,
    //   startColumn,
    //   endLineNumber,
    //   endColumn,
    // })
    editor.revealRange({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    })
  }, [focusedItem])

  // sync nodeTreeView&StageView based on editor's cursor pos
  const cursorPos = monacoRef.current === null ? null : monacoRef.current.getPosition()
  useEffect(() => {
    // validate
    if (cursorPos === null) return
    if (currentFileUid === '') return
    if (reduxTimeout.current !== null) return

    let _uid: TUid = ''

    let uids: TUid[] = Object.keys(treeData)
    uids = getBfsUids(uids)
    uids.reverse()
    for (const uid of uids) {
      const node = treeData[uid]
      const { startLineNumber, startColumn, endLineNumber, endColumn } = node.data
      if (startLineNumber === endLineNumber) {
        if (cursorPos.lineNumber === startLineNumber && (startColumn < cursorPos.column && cursorPos.column <= endColumn)) {
          _uid = uid
          break
        }
      } else {
        if ((startLineNumber < cursorPos.lineNumber && cursorPos.lineNumber < endLineNumber) ||
          (startLineNumber === cursorPos.lineNumber && startColumn < cursorPos.column) ||
          (cursorPos.lineNumber === endLineNumber && cursorPos.column <= endColumn)) {
          _uid = uid
          break
        }
      }
    }

    if (_uid === '') return

    let node = treeData[_uid]
    while (!node.data.valid) {
      node = treeData[node.p_uid as TUid]
    }

    _uid = node.uid
    if (_focusedItem.current === _uid) return
    _focusedItem.current = _uid

    // update redux
    addRunningAction(['cursorChange'])
    dispatch(Main.focusFNNode(_uid))
    dispatch(Main.selectFNNode([_uid]))
    removeRunningAction(['cursorChange'])
  }, [cursorPos])
  useEffect(() => {
    if (monacoRef.current === null || cursorPos === null) return

    if (syncWithNodeTreeView.current === false) return
    syncWithNodeTreeView.current = false

    const editor = monacoRef.current as monaco.editor.IEditor
    editor.setSelection({
      startLineNumber: cursorPos.lineNumber,
      startColumn: cursorPos.column,
      endLineNumber: cursorPos.lineNumber,
      endColumn: cursorPos.column,
    })
  }, [treeData])

  // Local Save with Debounce - config.CodeViewSyncDelay & Auto Save with Deplay - config.FileAutoSaveInterval
  const reduxTimeout = useRef<NodeJS.Timeout | null>(null)
  const fsTimeout = useRef<NodeJS.Timeout | null>(null)
  const handleEditorChange = useCallback((value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => {
    const editorContent = value || ''

    // skip same content
    if (editorContent === contentRef.current) return

    // update local
    contentRef.current = editorContent

    // update redux
    reduxTimeout.current !== null && clearTimeout(reduxTimeout.current)
    reduxTimeout.current = setTimeout(saveFileContentToRedux, config.CodeViewSyncDelay)

    // update file syste,
    fsTimeout.current !== null && clearTimeout(fsTimeout.current)
    fsTimeout.current = setTimeout(saveFileContentToFs, config.FileAutoSaveInterval)
  }, [])

  // save file content to redux
  const saveFileContentToRedux = useCallback(() => {
    addRunningAction(['codeChanged'])
    dispatch(Main.updateFileContent(contentRef.current))
    removeRunningAction(['codeChanged'])
    reduxTimeout.current = null
  }, [])

  // save file content to real file system
  const saveFileContentToFs = useCallback(async () => {
    // get the current file handler
    let handler = ffHandlers[currentFileUid]
    if (handler === undefined) return

    // verify permission
    if (await verifyPermission(handler) === false) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'auto save failed cause of invalid handler',
      }))
    }

    // update file content
    const writableStream = await (handler as FileSystemFileHandle).createWritable()
    await writableStream.write(content)
    await writableStream.close()

    dispatch(Main.updateFileStatus(true))

    fsTimeout.current = null
  }, [ffHandlers, currentFileUid])

  return <>
    <div className='box'>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage={"html"}
        language={'html'}
        defaultValue=""
        value={contentRef.current}
        theme="vs-dark"
        // line={line}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          // enableBasicAutocompletion: true,
          // enableLiveAutocompletion: true,
          // enableSnippets: true,
          // showLineNumbers: true,
          tabSize: tabSize,
          wordWrap: wordWrap,
        }}
      />
    </div>
  </>
}