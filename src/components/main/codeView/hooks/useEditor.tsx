import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { editor, IPosition, KeyCode, KeyMod } from "monaco-editor";
import { useDispatch } from "react-redux";

import { DefaultTabSize, RootNodeUid } from "@_constants/main";

import { getSubNodeUidsByBfs } from "@_node/helpers";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setCodeViewTabSize } from "@_redux/main/codeView";

import { CodeSelection } from "../types";

function getLanguageFromExtension(extension: string) {
  if (extension) return extension;
  return "plaintext";
}

export default function useEditor() {
  const dispatch = useDispatch();
  const { setMonacoEditorRef, parseFileFlag } = useContext(MainContext);

  const [language, setLanguage] = useState("html");
  const [focusedNode, setFocusedNode] = useState<TNode>();
  const wordWrap: editor.IEditorOptions["wordWrap"] = "on";

  const editorConfigs: editor.IEditorConstructionOptions = {
    contextmenu: true,
    wordWrap,
    minimap: { enabled: false },
    automaticLayout: true,
    selectionHighlight: false,
    autoClosingBrackets: "always",
    autoIndent: "full",
    autoClosingQuotes: "always",
    autoClosingOvertype: "always",
    autoSurround: "languageDefined",
    codeLens: false,
    formatOnPaste: true,
    formatOnType: true,
    tabCompletion: "on",
  };

  const [codeContent, setCodeContent] = useState<string>("");

  const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const codeChangeDecorationRef = useRef<
    Map<TNodeUid, editor.IModelDeltaDecoration[]>
  >(new Map<TNodeUid, editor.IModelDeltaDecoration[]>());
  const validNodeTreeRef = useRef<TNodeTreeData>({});
  const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection>();
  const currentPosition = useRef<IPosition | null>(null);

  // watch focus/selection for the editor
  const firstSelection = useRef<CodeSelection | null>(null);
  const [selection, setSelection] = useState<CodeSelection | null>(null);
  const isFirst = useRef<boolean>(true);

  const updateSelection = useCallback(() => {
    const monacoEditor = getCurrentEditorInstance();
    if (!parseFileFlag) return;
    const _selection = monacoEditor?.getSelection();

    if (_selection) {
      if (isFirst.current) {
        firstSelection.current = _selection;
        isFirst.current = false;
        return;
      }
      if (
        firstSelection.current &&
        (_selection.startLineNumber !==
          firstSelection.current.startLineNumber ||
          _selection.startColumn !== firstSelection.current.startColumn ||
          _selection.endLineNumber !== firstSelection.current.endLineNumber ||
          _selection.endColumn !== firstSelection.current.endColumn)
      ) {
        firstSelection.current = _selection;
        if (
          !selection ||
          _selection.startLineNumber !== selection.startLineNumber ||
          _selection.startColumn !== selection.startColumn ||
          _selection.endLineNumber !== selection.endLineNumber ||
          _selection.endColumn !== selection.endColumn
        ) {
          setSelection({
            startLineNumber: _selection.startLineNumber,
            startColumn: _selection.startColumn,
            endLineNumber: _selection.endLineNumber,
            endColumn: _selection.endColumn,
          });
        }
      }
    } else {
      setSelection(null);
    }
  }, [selection, parseFileFlag]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    monacoRef.current = editor;
    setMonacoEditorRef(editor);
    //override undo/redo
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyZ, () => {});
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyY, () => {});

    editor.onDidChangeCursorPosition((event) => {
      if (event.source === "mouse") {
        updateSelection();
      }
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

  function getCodeChangeDecorationInstance() {
    return codeChangeDecorationRef.current;
  }

  function getValidNodeTreeInstance() {
    return validNodeTreeRef;
  }

  function findNodeBySelection(
    selection: CodeSelection,
    validNodeTree: TNodeTreeData,
  ): TNode | null {
    let focusedNode: TNode | null = null;
    if (selection) {
      let _uid: TNodeUid = "";
      const uids = getSubNodeUidsByBfs(RootNodeUid, validNodeTree);
      uids.reverse();
      for (const uid of uids) {
        const node = validNodeTree[uid];
        const sourceCodeLocation = node.data.sourceCodeLocation;

        if (!sourceCodeLocation) {
          continue;
        }

        let {
          startLine: startLineNumber,
          startCol: startColumn,
          endCol: endColumn,
          endLine: endLineNumber,
        } = sourceCodeLocation;

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
        focusedNode = structuredClone(node);
      }
    }
    return focusedNode;
  }

  // tabSize
  useEffect(() => {
    dispatch(setCodeViewTabSize(DefaultTabSize));
  }, []);

  return {
    getCurrentEditorInstance,
    getCodeChangeDecorationInstance,
    getValidNodeTreeInstance,
    decorationCollectionRef,
    currentPosition,
    handleEditorDidMount,
    language,
    updateLanguage,
    editorConfigs,
    findNodeBySelection,
    focusedNode,
    setFocusedNode,
    codeContent,
    setCodeContent,
    selection,
    updateSelection,
  };
}
