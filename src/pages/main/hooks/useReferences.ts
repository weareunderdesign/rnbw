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
  const isContentProgrammaticallyChanged = useRef(false);
  const setIsContentProgrammaticallyChanged = useCallback((value: boolean) => {
    isContentProgrammaticallyChanged.current = value;
  }, []);
  const isCodeTyping = useRef(false);
  const setIsCodeTyping = useCallback((value: boolean) => {
    isCodeTyping.current = value;
  }, []);

  return {
    monacoEditorRef,
    setMonacoEditorRef,
    iframeRefRef,
    setIframeRefRef,
    isContentProgrammaticallyChanged,
    setIsContentProgrammaticallyChanged,
    isCodeTyping,
    setIsCodeTyping,
  };
};
