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

import {
  CodeViewSyncDelay,
  FileAutoSaveInterval,
} from '@_config/main';
import * as Main from '@_redux/main';
import { verifyPermission } from '@_services/main';
import Editor, { loader } from '@monaco-editor/react';

import { CodeViewProps } from './types';

loader.config({ monaco })

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch()

  // fetch necessary state
  const { uid, type, content } = useSelector(Main.globalGetCurrentFileSelector)

  // local state - code content
  const [codeContent, setCodeContent] = useState('')
  useEffect(() => {
    setCodeContent(content)
  }, [content])

  // Local Save/ Auto Save with Deplay - config.FileAutoSaveInterval
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout>()
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>()
  const { ffHandlers } = useContext(Main.MainContext)
  const saveFileContent = async () => {
    return

    // get the current file handler
    let handler = ffHandlers[uid]
    if (handler === undefined) return

    /* for the remote rainbow */
    if (await verifyPermission(handler) === false) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'auto save failed cause of invalid handler',
      }))
    }

    const writableStream = await (handler as FileSystemFileHandle).createWritable()
    await writableStream.write(content)
    await writableStream.close()

    dispatch(Main.updateFileStatus(true))
  }
  const handleEditorChange = useCallback((value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => {
    let editorContent = value || ''
    if (editorContent === content) return

    setCodeContent(editorContent)

    // local save delay
    if (syncTimer !== undefined) {
      clearTimeout(syncTimer)
    }
    setSyncTimer(setTimeout(() => { dispatch(Main.updateFileContent(editorContent)) }, CodeViewSyncDelay))

    // file system auto save delay
    if (autoSaveTimer !== undefined) {
      clearTimeout(autoSaveTimer)
    }
    setAutoSaveTimer(setTimeout(saveFileContent, FileAutoSaveInterval))
  }, [content, syncTimer, autoSaveTimer])

  // Monaco Ref
  const monacoRef = useRef(null)
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor
  }

  return <>
    <div className='box'>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage={"html"}
        language={'html'}
        defaultValue=""
        value={codeContent}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          // enableBasicAutocompletion: true,
          // enableLiveAutocompletion: true,
          // enableSnippets: true,
          // showLineNumbers: true,
          tabSize: 4,
          wordWrap: "on",
        }}
      />
    </div>
  </>
}