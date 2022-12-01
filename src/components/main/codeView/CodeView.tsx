import React, {
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
  globalGetCurrentFileSelector,
  updateFileContent,
} from '@_redux/main';
import Editor, { loader } from '@monaco-editor/react';

import { CodeViewProps } from './types';

loader.config({ monaco })

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const { content } = useSelector(globalGetCurrentFileSelector)

  // local state - code content
  const [codeContent, setCodeContent] = useState('')
  useEffect(() => {
    setCodeContent(content)
  }, [content])


  // Monaco Ref
  const monacoRef = useRef(null);
  function handleEditorDidMount(editor: any, monaco: any) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor;
  }

  // Local Save Deplay - 0
  const [timer, setTimer] = useState<NodeJS.Timeout>()
  function handleEditorChange(value: any, event: any) {
    setCodeContent(value)

    // save delay
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    setTimer(setTimeout(() => { dispatch(updateFileContent(value)) }, 0))
  }

  return <>
    <div className='box'>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage=""
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