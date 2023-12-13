import { useRef } from "react";

import { editor } from "monaco-editor";

export const useReferneces = () => {
  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const setMonacoEditorRef = (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => {
    monacoEditorRef.current = editorInstance;
  };
  const iframeRefRef = useRef<HTMLIFrameElement | null>(null);
  const setIframeRefRef = (iframeRef: HTMLIFrameElement | null) => {
    iframeRefRef.current = iframeRef;
  };
  const isContentProgrammaticallyChanged = useRef<boolean>(false);
  const setIsContentProgrammaticallyChanged = (value: boolean) => {
    isContentProgrammaticallyChanged.current = value;
  };

  return {
    monacoEditorRef,
    setMonacoEditorRef,
    iframeRefRef,
    setIframeRefRef,
    isContentProgrammaticallyChanged,
    setIsContentProgrammaticallyChanged,
  };
};
