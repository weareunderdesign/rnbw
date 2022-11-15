import React, {
  useMemo,
  useRef,
} from 'react';

import * as monaco from 'monaco-editor';
import { useSelector } from 'react-redux';

import Editor, { loader } from '@monaco-editor/react';
import { globalGetCurrentFileSelector } from '@redux/global';

loader.config({ monaco })

export default function CodeView() {
  const { uid, type, content } = useSelector(globalGetCurrentFileSelector)
  const codeContent = useMemo(() => content, [content])

  const monacoRef = useRef(null);
  function handleEditorDidMount(editor: any, monaco: any) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor;
  }

  return <>
    <Editor
      height="100%"
      width="100%"
      defaultLanguage=""
      language={'html'}
      defaultValue=""
      value={codeContent}
      theme="vs-dark"
      onMount={handleEditorDidMount}
      options={{
        // enableBasicAutocompletion: true,
        // enableLiveAutocompletion: true,
        // enableSnippets: true,
        // showLineNumbers: true,
        tabSize: 4,
      }}
    />
  </>
}