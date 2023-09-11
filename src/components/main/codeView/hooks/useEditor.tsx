import { useContext, useRef, useState, useEffect } from "react";
import { IPosition, editor } from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { MainContext } from "@_redux/main";

import { DefaultTabSize } from "@_constants/main";

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
  const { tabSize, setTabSize } = useContext(MainContext);
  const wordWrap: editor.IEditorOptions["wordWrap"] = "off";
  const editorConfigs = {
    contextmenu: true,
    tabSize,
    wordWrap,
    minimap: { enabled: false },
    automaticLayout: false,
  };

  const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection>();
  const currentPosition = useRef<IPosition | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
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

  function getCurrentEditorInstance() {
    return monacoRef.current;
  }

  // tabSize
  useEffect(() => {
    setTabSize(DefaultTabSize);
  }, []);

  return {
    getCurrentEditorInstance,
    decorationCollectionRef,
    currentPosition,
    handleEditorDidMount,
    language,
    updateLanguage,
    editorConfigs,
  };
}
