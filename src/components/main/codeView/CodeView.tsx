import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { debounce } from 'lodash';
import * as monaco from 'monaco-editor';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

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
  TNodeTreeData,
  TNodeUid,
} from '@_node/index';
import {
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
  setCurrentFileContent,
} from '@_redux/main';
import { getLineBreaker } from '@_services/global';
import { TCodeChange } from '@_types/main';
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
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // file tree view
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme: _theme,
    // toasts
    addMessage, removeMessage,
  } = useContext(MainContext)
  // -------------------------------------------------------------- references --------------------------------------------------------------
  const isFirst = useRef<boolean>(true)
  const monacoRef = useRef<monaco.editor.IEditor | null>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const codeContent = useRef<string>('')
  const decorationCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection>()
  const codeChangeDecorationRef = useRef<Map<TNodeUid, monaco.editor.IModelDeltaDecoration[]>>(new Map<TNodeUid, monaco.editor.IModelDeltaDecoration[]>())
  const validNodeTreeRef = useRef<TNodeTreeData>({})
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    monacoRef.current = editor
    decorationCollectionRef.current = editor.createDecorationsCollection()
  }, [])
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // build node tree refernece
  useEffect(() => {
    validNodeTreeRef.current = JSON.parse(JSON.stringify(validNodeTree))

    // set new focused node
    if (newFocusedNodeUid !== '') {
      setFocusedNode(validNodeTree[newFocusedNodeUid])
      !isFirst.current ? focusedItemRef.current = newFocusedNodeUid : null
      setNewFocusedNodeUid('')
    }
  }, [validNodeTree])
  // file content change - set code
  useEffect(() => {
    const _file = ffTree[file.uid]
    if (!_file) return

    if (updateOpt.from === 'code') return

    const fileData = _file.data as TFileNodeData
    codeContent.current = fileData.content
  }, [ffTree[file.uid]])
  // focusedItem - code select
  const focusedItemRef = useRef<TNodeUid>('')
  const revealed = useRef<boolean>(false)
  useEffect(() => {
    if (focusedItem === RootNodeUid || focusedItemRef.current === focusedItem) return
    if (!validNodeTree[focusedItem]) return

    if (codeEditing) return

    const node = validNodeTree[focusedItem]
    const { startLineNumber, startColumn, endLineNumber, endColumn } = node.data as THtmlNodeData

    if (isFirst.current) {
      const firstTimer = setInterval(() => {
        if (monacoRef.current) {
          monacoRef.current.setSelection({
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          })
          monacoRef.current.revealRangeInCenter({
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          }, 1)
          revealed.current = false
          clearInterval(firstTimer)
        }
      }, 0)
    } else {
      monacoRef.current?.setSelection({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      })
      monacoRef.current?.revealRangeInCenter({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      }, 1)
      revealed.current = true
    }

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // watch focus/selection for the editor
  const firstSelection = useRef<CodeSelection | null>(null)
  const [selection, setSelection] = useState<CodeSelection | null>(null)
  const updateSelection = useCallback(() => {
    const _selection = monacoRef.current?.getSelection()
    if (_selection) {
      if (isFirst.current) {
        firstSelection.current = _selection
        isFirst.current = false
        return
      }
      if (firstSelection.current && (_selection.startLineNumber !== firstSelection.current.startLineNumber || _selection.startColumn !== firstSelection.current.startColumn
        || _selection.endLineNumber !== firstSelection.current.endLineNumber || _selection.endColumn !== firstSelection.current.endColumn)) {
        firstSelection.current = _selection
        if (!selection || _selection.startLineNumber !== selection.startLineNumber || _selection.startColumn !== selection.startColumn
          || _selection.endLineNumber !== selection.endLineNumber || _selection.endColumn !== selection.endColumn) {
          setSelection({
            startLineNumber: _selection.startLineNumber,
            startColumn: _selection.startColumn,
            endLineNumber: _selection.endLineNumber,
            endColumn: _selection.endColumn,
          })
        }
      }
    } else {
      setSelection(null)
    }
  }, [selection])
  useEffect(() => {
    const cursorDetectInterval = setInterval(() => updateSelection(), 0)
    return () => clearInterval(cursorDetectInterval)
  }, [updateSelection])
  // detect node of current selection
  const [focusedNode, setFocusedNode] = useState<TNode>()
  useEffect(() => {
    if (!selection) return

    const _file = ffTree[file.uid]
    if (!_file) return

    // this means, code view is already opened before file read
    if (!validNodeTreeRef.current[RootNodeUid]) return

    // avoid loop when reveal focused node's code block
    if (revealed.current === true) {
      revealed.current = false
      return
    }

    if (selection) {
      let _uid: TNodeUid = ''
      const uids = getSubNodeUidsByBfs(RootNodeUid, validNodeTreeRef.current)
      uids.reverse()
      for (const uid of uids) {
        const node = validNodeTreeRef.current[uid]
        const nodeData = node.data as THtmlNodeData
        const { startLineNumber, startColumn, endLineNumber, endColumn } = nodeData

        const containFront = selection.startLineNumber === startLineNumber ?
          selection.startColumn > startColumn
          : selection.startLineNumber > startLineNumber
        const containBack = selection.endLineNumber === endLineNumber ?
          selection.endColumn < endColumn
          : selection.endLineNumber < endLineNumber

        if (containFront && containBack) {
          _uid = uid
          break
        }
      }
      if (_uid !== '') {
        const node = validNodeTreeRef.current[_uid]
        setFocusedNode(JSON.parse(JSON.stringify(node)))
      }
    }
  }, [selection])
  useEffect(() => {
    if (focusedNode) {
      if (focusedNode.uid === focusedItemRef.current) return

      if (updateOpt.from === 'hms') return

      // expand path to the uid
      const _expandedItems: TNodeUid[] = []
      let node = validNodeTree[focusedNode.uid]
      while (node.uid !== RootNodeUid) {
        _expandedItems.push(node.uid)
        node = validNodeTree[node.parentUid as TNodeUid]
      }
      _expandedItems.shift()
      dispatch(expandFNNode(_expandedItems))

      dispatch(focusFNNode(focusedNode.uid))
      dispatch(selectFNNode([focusedNode.uid]))

      focusedItemRef.current = focusedNode.uid
    }
  }, [focusedNode])
  // code edit - highlight/parse
  const reduxTimeout = useRef<NodeJS.Timeout | null>(null)
  const saveFileContentToRedux = useCallback(() => {
    // clear highlight
    decorationCollectionRef.current?.clear()

    // skip same content
    const _file = ffTree[file.uid]
    const fileData = _file.data as TFileNodeData
    if (fileData.content === codeContent.current) {
      validNodeTreeRef.current = JSON.parse(JSON.stringify(validNodeTree))

      codeChangeDecorationRef.current.clear()
      setCodeEditing(false)
      return
    }

    // get code changes
    const currentCode = codeContent.current
    const currentCodeArr = currentCode.split(getLineBreaker(osType))
    const codeChanges: TCodeChange[] = []
    for (const codeChange of codeChangeDecorationRef.current.entries()) {
      const uid = codeChange[0]

      const { startLineNumber, startColumn, endLineNumber, endColumn } = codeChange[1][0].range
      const partCodeArr: string[] = []
      partCodeArr.push(currentCodeArr[startLineNumber !== 0 ? startLineNumber - 1 : 0].slice(startColumn !== 0 ? startColumn - 1 : 0))
      for (let line = startLineNumber - 1 + 1; line < endLineNumber - 1; ++line) {
        partCodeArr.push(currentCodeArr[line])
      }
      endLineNumber > startLineNumber && partCodeArr.push(currentCodeArr[endLineNumber - 1].slice(0, endColumn - 1))
      const content = partCodeArr.join(getLineBreaker(osType))

      codeChanges.push({ uid, content })
    }
    setCodeChanges(codeChanges)

    // update
    dispatch(setCurrentFileContent(codeContent.current))
    addRunningActions(['processor-updateOpt'])
    setUpdateOpt({ parse: true, from: 'code' })

    codeChangeDecorationRef.current.clear()
    reduxTimeout.current = null
    setFocusedNode(undefined)
  }, [ffTree, file.uid, validNodeTree, osType])
  const handleEditorChange = useCallback((value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => {
    const hasFocus = monacoRef.current?.hasTextFocus()
    if (!hasFocus) return

    if (!focusedNode) return

    // get changed part
    const { eol } = ev
    const { range: o_range, text: changedCode } = ev.changes[0]
    const o_rowCount = o_range.endLineNumber - o_range.startLineNumber + 1

    const changedCodeArr = changedCode.split(eol)
    const n_rowCount = changedCodeArr.length
    const n_range: monaco.IRange = {
      startLineNumber: o_range.startLineNumber,
      startColumn: o_range.startColumn,
      endLineNumber: o_range.startLineNumber + n_rowCount - 1,
      endColumn: n_rowCount === 1 ? o_range.startColumn + changedCode.length : (changedCodeArr.pop() as string).length + 1,
    }

    const columnOffset = (o_rowCount === 1 && n_rowCount > 1 ? -1 : 1) * (n_range.endColumn - o_range.endColumn)

    // update code range for node tree
    const focusedNodeData = focusedNode.data as THtmlNodeData
    const uids = getSubNodeUidsByBfs(RootNodeUid, validNodeTreeRef.current)
    let completelyRemoved = false
    uids.map(uid => {
      const node = validNodeTreeRef.current[uid]
      if (!node) return

      const nodeData = node.data as THtmlNodeData
      const { startLineNumber, startColumn, endLineNumber, endColumn } = nodeData

      const containFront = focusedNodeData.startLineNumber === startLineNumber ?
        focusedNodeData.startColumn >= startColumn
        : focusedNodeData.startLineNumber > startLineNumber
      const containBack = focusedNodeData.endLineNumber === endLineNumber ?
        focusedNodeData.endColumn <= endColumn
        : focusedNodeData.endLineNumber < endLineNumber

      if (containFront && containBack) {
        nodeData.endLineNumber += n_rowCount - o_rowCount
        nodeData.endColumn += endLineNumber === o_range.endLineNumber ? columnOffset : 0

        if (nodeData.endLineNumber === nodeData.startLineNumber && nodeData.endColumn === nodeData.startColumn) {
          const parentNode = validNodeTreeRef.current[focusedNode.parentUid as TNodeUid]
          parentNode.children = parentNode.children.filter(c_uid => c_uid !== focusedNode.uid)

          const subNodeUids = getSubNodeUidsByBfs(focusedNode.uid, validNodeTreeRef.current)
          subNodeUids.map(uid => {
            codeChangeDecorationRef.current.delete(uid)
            delete validNodeTreeRef.current[uid]
          })

          completelyRemoved = true
        }
      } else if (containBack) {
        nodeData.startLineNumber += n_rowCount - o_rowCount
        nodeData.startColumn += startLineNumber === o_range.endLineNumber ? columnOffset : 0
        nodeData.endLineNumber += n_rowCount - o_rowCount
        nodeData.endColumn += endLineNumber === o_range.endLineNumber ? columnOffset : 0
      }
    })
    if (!completelyRemoved) {
      const subNodeUids = getSubNodeUidsByBfs(focusedNode.uid, validNodeTreeRef.current, false)
      subNodeUids.map(uid => {
        codeChangeDecorationRef.current.delete(uid)

        const node = validNodeTreeRef.current[uid]
        const nodeData = node.data as THtmlNodeData
        nodeData.startLineNumber = 0
        nodeData.startColumn = 0
        nodeData.endLineNumber = 0
        nodeData.endColumn = 0
      })
    }

    // update decorations
    const focusedNodeDecorations: monaco.editor.IModelDeltaDecoration[] = []
    const focusedNodeCodeRange: monaco.IRange = validNodeTreeRef.current[focusedNode.uid].data as THtmlNodeData
    if (!completelyRemoved) {
      focusedNodeDecorations.push(
        {
          range: focusedNodeCodeRange,
          options: {
            isWholeLine: true,
            className: 'focusedNodeCode',
          }
        },
        {
          range: n_range,
          options: {
            isWholeLine: false,
            className: 'changedCode',
          }
        },
      )
    }
    codeChangeDecorationRef.current.set(focusedNode.uid, focusedNodeDecorations)

    // render decorations
    const decorationsList = codeChangeDecorationRef.current.values()
    const wholeDecorations: monaco.editor.IModelDeltaDecoration[] = []
    for (const decorations of decorationsList) {
      wholeDecorations.push(...decorations)
    }
    decorationCollectionRef.current?.set(wholeDecorations)

    // update redux with debounce
    codeContent.current = value || ''

    reduxTimeout.current !== null && clearTimeout(reduxTimeout.current)
    reduxTimeout.current = setTimeout(saveFileContentToRedux, CodeViewSyncDelay)

    setCodeEditing(true)
  }, [saveFileContentToRedux, focusedNode])
  // -------------------------------------------------------------- monaco-editor options --------------------------------------------------------------
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
  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('code')
  }, [])
  // editor-resize
  useEffect(() => {
    const resetEditorLayout = () => {
      monacoRef.current?.layout({ width: 0, height: 0 })
      window.requestAnimationFrame(() => {
        const wrapperRect = editorWrapperRef.current?.getBoundingClientRect()
        wrapperRect && monacoRef.current?.layout({ width: wrapperRect.width, height: wrapperRect.height })
      })
    }
    const debounced = debounce(resetEditorLayout, 100)
    const resizeObserver = new ResizeObserver(debounced)

    editorWrapperRef.current && resizeObserver.observe(editorWrapperRef.current)
    return () => {
      editorWrapperRef.current && resizeObserver.unobserve(editorWrapperRef.current)
    }
  }, [editorWrapperRef.current])

  return useMemo(() => {
    return <>
      <div
        id="CodeView"
        className={'scrollable'}
        onClick={onPanelClick}
        ref={editorWrapperRef}
      >
        <Editor
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
            automaticLayout: false,
          }}
        />
      </div>
    </>
  }, [
    onPanelClick,
    language, theme,
    handleEditorDidMount, handleEditorChange,
    tabSize, wordWrap,
  ])
}