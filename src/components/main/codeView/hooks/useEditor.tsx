import { useContext, useRef, useState, useEffect } from "react";
import { IPosition, editor } from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { MainContext } from "@_redux/main";

import { DefaultTabSize, RootNodeUid } from "@_constants/main";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { THtmlNodeData } from "@_node/html";
import { getPositionFromIndex } from "@_services/htmlapi";
import { CodeSelection } from "../types";

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
  const { tabSize, setTabSize, codeEditing, setCodeEditing } =
    useContext(MainContext);
  const wordWrap: editor.IEditorOptions["wordWrap"] = "off";
  const editorConfigs = {
    contextmenu: true,
    tabSize,
    wordWrap,
    minimap: { enabled: false },
    automaticLayout: false,
  };
  const codeContent = useRef<string>("");

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

  function findNodeBySelection(
    selection: CodeSelection,
    validNodeTree: TNodeTreeData,
    monacoEditor: editor.IStandaloneCodeEditor | null,
  ): TNode | null {
    debugger;
    let focusedNode: TNode | null = null;
    if (selection) {
      let _uid: TNodeUid = "";
      const uids = getSubNodeUidsByBfs(RootNodeUid, validNodeTree);
      uids.reverse();
      for (const uid of uids) {
        const node = validNodeTree[uid];
        const nodeData = node.data as THtmlNodeData;
        const { startIndex, endIndex } = nodeData;

        if (
          !monacoEditor ||
          startIndex === undefined ||
          endIndex === undefined
        ) {
          continue;
        }

        const { startLineNumber, startColumn, endLineNumber, endColumn } =
          getPositionFromIndex(monacoEditor, startIndex, endIndex);

        const containFront =
          selection.startLineNumber === startLineNumber
            ? selection.startColumn > startColumn
            : selection.startLineNumber > startLineNumber;
        const containBack =
          selection.endLineNumber === endLineNumber
            ? selection.endColumn < endColumn
            : selection.endLineNumber < endLineNumber;

        if (containFront && containBack) {
          _uid = uid;
          break;
        }
      }
      if (_uid !== "") {
        const node = validNodeTree[_uid];
        focusedNode = JSON.parse(JSON.stringify(node));
      }
    }
    return focusedNode;
  }

  function updateFileContentOnRedux(
    value: string | undefined,
    monacoEditor: editor.IStandaloneCodeEditor | undefined,
    reduxTimeout: NodeJS.Timeout | null,
    saveFileContentToRedux: () => void,
    currentPosition: React.MutableRefObject<IPosition | null>,
    delay: number,
    setCodeEditing: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    codeContent.current = value || "";
    const newPosition = monacoEditor?.getPosition();
    if (newPosition !== undefined) {
      currentPosition.current = newPosition;
    }

    reduxTimeout !== null && clearTimeout(reduxTimeout);
    let updatedTimeout = setTimeout(saveFileContentToRedux, delay);
    setCodeEditing(true);
    return updatedTimeout;
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
    findNodeBySelection,
    codeEditing,
    setCodeEditing,
    updateFileContentOnRedux,
  };
}
