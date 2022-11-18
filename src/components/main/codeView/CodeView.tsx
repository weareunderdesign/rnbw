import React, {
  useMemo,
  useRef,
} from 'react';

import * as monaco from 'monaco-editor';
import { CodeViewProps } from 'react-code-view';
import { useSelector } from 'react-redux';

import { globalGetCurrentFileSelector } from '@_redux/global';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ monaco })

export default function CodeView(props: CodeViewProps) {
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
      width="calc(100% - 400px)"
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