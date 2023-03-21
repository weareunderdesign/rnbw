import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import * as monaco from 'monaco-editor';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  CodeViewSyncDelay,
  DefaultTabSize,
  RootNodeUid,
} from '@_constants/main';
import {
  getSubNodeUidsByBfs,
  TFileNodeData,
  THtmlNodeData,
  TNode,
  TNodeUid,
} from '@_node/index';
import {
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
import Editor, {
  loader,
  Monaco,
} from '@monaco-editor/react';

import {
  CodeSelection,
  CodeViewProps,
} from './types';

loader.config({ monaco })

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch()

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
    isHms, setIsHms, ffAction, setFFAction,

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

    // theme
    theme: _theme,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // file changed - clear history
  useEffect(() => {
    // need to clear the undo/redo history of the monaco-editor
    /**
         * Create an "undo stop" in the undo-redo stack.
         */
    // pushUndoStop(): boolean;
    /**
     * Remove the "undo stop" in the undo-redo stack.
     */
    // popUndoStop(): boolean;
  }, [file.uid])
  // focusedItem - code select
  const focusedItemRef = useRef<TNodeUid>('')
  useEffect(() => {
    if (monacoRef.current === null) return

    if (focusedItemRef.current === focusedItem) return

    const node = validNodeTree[focusedItem]
    if (node === undefined) return

    const { startLineNumber, startColumn, endLineNumber, endColumn } = node.data as THtmlNodeData

    const editor = monacoRef.current as monaco.editor.IEditor
    editor.setSelection({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    })
    editor.revealRangeInCenter({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    }, 1/* scrollType - smooth */)

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // update editor's content
  useEffect(() => {
    if (updateOpt.from === 'code') return

    const _file = ffTree[file.uid]
    if (!_file) return

    const fileData = _file.data as TFileNodeData
    codeContent.current = fileData.content
  }, [ffTree[file.uid]])
  // watch code selection in the editor
  const [selection, setSelection] = useState<CodeSelection | null>({
    startLineNumber: 0,
    startColumn: 0,
    endLineNumber: 0,
    endColumn: 0,
  })
  const detectFocusedNode = useCallback(() => {
    const _selection = monacoRef.current?.getSelection()
    if (_selection) {
      if (!selection || _selection.startLineNumber !== selection.startLineNumber || _selection.startColumn !== selection.startColumn
        || _selection.endLineNumber !== selection.endLineNumber || _selection.endColumn !== selection.endColumn) {
        setSelection({
          startLineNumber: _selection.startLineNumber,
          startColumn: _selection.startColumn,
          endLineNumber: _selection.endLineNumber,
          endColumn: _selection.endColumn,
        })
      }
    } else {
      setSelection(null)
    }
  }, [selection])
  useEffect(() => {
    const cursorDetectInterval = setInterval(() => {
      detectFocusedNode()
    }, 0)

    return () => clearInterval(cursorDetectInterval)
  }, [detectFocusedNode])
  // detect node of current selection/cursor
  const [focusedNode, setFocusedNode] = useState<TNode>()
  useEffect(() => {
    if (!selection) return

    const _file = ffTree[file.uid]
    if (!_file) return

    if (selection) {
      let _uid: TNodeUid = ''
      const uids = getSubNodeUidsByBfs(RootNodeUid, nodeTree)
      uids.reverse()
      for (const uid of uids) {
        const node = nodeTree[uid]
        const nodeData = node.data as THtmlNodeData
        const { startLineNumber, startColumn, endLineNumber, endColumn } = nodeData

        const containFront = selection.startLineNumber === startLineNumber ?
          selection.startColumn >= startColumn
          : selection.startLineNumber > startLineNumber
        const containBack = selection.endLineNumber === endLineNumber ?
          selection.endColumn <= endColumn
          : selection.endLineNumber < endLineNumber

        if (containFront && containBack) {
          _uid = uid
          break
        }
      }
      if (_uid !== '') {
        const node = nodeTree[_uid]
        setFocusedNode(node)
      }
    }
  }, [selection])
  const isFirstTime = useRef<boolean>(true)
  useEffect(() => {
    if (focusedNode) {
      if (isFirstTime.current) {
        isFirstTime.current = false
        return
      }

      addRunningActions(['codeView-focus'])

      // expand path to the uid
      const _expandedItems: TNodeUid[] = []
      let node = nodeTree[focusedNode.uid]
      while (node.uid !== RootNodeUid) {
        _expandedItems.push(node.uid)
        node = nodeTree[node.parentUid as TNodeUid]
      }
      _expandedItems.shift()
      dispatch(expandFNNode(_expandedItems))

      dispatch(focusFNNode(focusedNode.uid))
      dispatch(selectFNNode([focusedNode.uid]))

      focusedItemRef.current = focusedNode.uid

      removeRunningActions(['codeView-focus'])
    }
  }, [focusedNode])
  // code edit - highlight/parse
  const codeContent = useRef<string>('')
  const reduxTimeout = useRef<NodeJS.Timeout | null>(null)
  const saveFileContentToRedux = useCallback(() => {
    decorationsRef.current = []
    decorationCollectionRef.current?.clear()

    const _file = ffTree[file.uid]
    if (!_file) return

    const fileData = _file.data as TFileNodeData

    if (fileData.content === codeContent.current) return

    // console.log(fileData.content, codeContent.current)

    // dispatch(setCurrentFileContent(codeContent.current))

    // addRunningActions(['processor-updateOpt'])
    // setUpdateOpt({ parse: true, from: 'code' })

    reduxTimeout.current = null
  }, [ffTree, file.uid])
  const handleEditorChange = useCallback((value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => {
    if (!focusedNode) return

    const change = ev.changes[0]
    const changedRange: monaco.IRange = true ? (focusedNode.data as THtmlNodeData) : {
      startLineNumber: change.range.startLineNumber,
      startColumn: change.range.startColumn,
      endLineNumber: change.range.startLineNumber + change.text.split(ev.eol).length - 1,
      endColumn: change.text.split(ev.eol).length === 1 ? change.range.startColumn + change.text.length : change.text.split(ev.eol).pop()?.length || 0,
    }

    console.log(change, changedRange)

    decorationsRef.current.push({
      range: changedRange,
      options: {
        isWholeLine: true,
        className: 'changedCode',
      }
    })
    decorationCollectionRef.current?.set(decorationsRef.current)

    // update redux with debounce
    // codeContent.current = value || ''

    reduxTimeout.current !== null && clearTimeout(reduxTimeout.current)
    reduxTimeout.current = setTimeout(saveFileContentToRedux, CodeViewSyncDelay)
  }, [saveFileContentToRedux, focusedNode])
  // -------------------------------------------------------------- monaco-editor --------------------------------------------------------------
  // instance
  const monacoRef = useRef<monaco.editor.IEditor | null>(null)
  const decorationsRef = useRef<monaco.editor.IModelDeltaDecoration[]>([])
  const decorationCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection>()
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor
    decorationCollectionRef.current = editor.createDecorationsCollection()
  }, [])
  // tabSize
  const [_tabSize, _setTabSize] = useState<number>(DefaultTabSize)
  useEffect(() => {
    setTabSize(_tabSize)
  }, [_tabSize])
  // wordWrap
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const toogleWrap = () => setWordWrap(wordWrap === 'on' ? 'off' : 'on')
  // language
  const [language, setLanguage] = useState('html')
  // theme
  const [theme, setTheme] = useState<'vs-dark' | 'light'>()
  const setSystemTheme = useCallback(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme('vs-dark')
    } else {
      setTheme('light')
    }
  }, [])
  useEffect(() => {
    _theme === 'Dark' ? setTheme('vs-dark') :
      _theme === 'Light' ? setTheme('light') :
        setSystemTheme()
  }, [_theme])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('code')
  }, [])

  return <>
    <Panel minSize={0}>
      <div
        id="CodeView"
        className={cx(
          'scrollable',
        )}
        onClick={onPanelClick}
      >
        <Editor
          width="100%"
          height="100%"
          defaultLanguage={"html"}
          language={language}
          defaultValue={""}
          value={codeContent.current}
          theme={theme}
          // line={line}
          // beforeMount={() => {}}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            // enableBasicAutocompletion: true,
            // enableLiveAutocompletion: true,
            // enableSnippets: true,
            // showLineNumbers: true,
            contextmenu: false,
            tabSize: tabSize,
            wordWrap: wordWrap,
            minimap: { enabled: false },
          }}
        />
      </div>
    </Panel>
  </>
}