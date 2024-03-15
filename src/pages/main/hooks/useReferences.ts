import { useCallback, useRef } from "react";

import { editor } from "monaco-editor";

export const useReferneces = () => {
  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const setMonacoEditorRef = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor | null) => {
      monacoEditorRef.current = editorInstance;
    },
    [],
  );
  const iframeRefRef = useRef<HTMLIFrameElement | null>(null);
  const setIframeRefRef = useCallback((iframeRef: HTMLIFrameElement | null) => {
    iframeRefRef.current = iframeRef;
  }, []);

  return {
    monacoEditorRef,
    setMonacoEditorRef,
    iframeRefRef,
    setIframeRefRef,
  };
};
