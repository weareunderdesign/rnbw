import { useState, useEffect, useRef, useContext } from "react";
import * as monaco from "monaco-editor";
import { MainContext } from "@_redux/main";
import { Monaco } from "@monaco-editor/react";

export default function useEditorMount() {
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef =
    useRef<monaco.editor.IEditorDecorationsCollection>();
  const currentPosition = useRef<monaco.IPosition | null>(null);

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    monacoRef.current = editor;
    editor.onDidChangeCursorPosition((event) => {
      setTimeout(() => {
        if (event.reason === 2) {
          currentPosition.current &&
            monacoRef.current?.setPosition(currentPosition.current);
        }
      }, 0);
    });
    decorationCollectionRef.current = editor.createDecorationsCollection();
  };

  return {
    monacoRef,
    decorationCollectionRef,
    currentPosition,
    handleEditorDidMount,
  };
}
