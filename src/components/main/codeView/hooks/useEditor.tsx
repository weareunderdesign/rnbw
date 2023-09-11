import { useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { Monaco } from "@monaco-editor/react";

function getLanguageFromExtension(extension: string) {
  switch (extension) {
    case ".html":
      return "html";
    case ".md":
      return "markdown";
    case ".js":
      return "javascript";
    case ".css":
      return "css";
    default:
      return "plaintext";
  }
}
export default function useEditor() {
  const [language, setLanguage] = useState("html");

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

  const updateLanguage = (extension: string) => {
    const language = getLanguageFromExtension(extension);
    setLanguage(language);
  };

  return {
    monacoRef,
    decorationCollectionRef,
    currentPosition,
    handleEditorDidMount,
    language,
    updateLanguage,
  };
}
