import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import * as monaco from "monaco-editor";
import { useDispatch } from "react-redux";

import { RootNodeUid } from "@src/rnbwTSX";
import {
  getDecorationUid,
  isUidDecoration,
  setDecorationUid,
  TFileNodeData,
  TNodeUid,
} from "@_api/index";
import { MainContext } from "@_redux/main";
import { setSelectedNodeUids } from "@_redux/main/nodeTree";
import { setActivePanel, setShowCodeView } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { Editor, loader } from "@monaco-editor/react";

import { useEditor } from "./hooks";
import { getNodeUidByCodeSelection } from "./helpers";
import { setEditingNodeUidInCodeView } from "@_redux/main/codeView";
import { getFileExtension } from "../sidebarView/navigatorPanel/helpers";

loader.config({ monaco });

export default function CodeView() {
  const dispatch = useDispatch();
  const {
    fileTree,
    currentFileUid,
    currentFileContent,
    nodeUidPositions,
    theme,
    nodeTree,
    validNodeTree,
    nFocusedItem,

    activePanel,
    showCodeView,

    editingNodeUidInCodeView,
    isCodeTyping,
    codeErrors,
  } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);

  const {
    handleEditorDidMount,
    handleOnChange,
    handleKeyDown,

    language,
    updateLanguage,

    editorConfigs,

    codeSelection,
  } = useEditor();

  monacoEditorRef.current?.onKeyDown(handleKeyDown);

  const onPanelClick = useCallback(() => {
    activePanel !== "code" && dispatch(setActivePanel("code"));
  }, [activePanel]);

  // language sync
  useEffect(() => {
    const file = fileTree[currentFileUid];
    if (!file) return;

    const fileData = file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);
  }, [fileTree, currentFileUid]);

  // scroll to top on file change
  useEffect(() => {
    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;
    monacoEditor.setScrollTop(0);
  }, [currentFileUid]);

  // focusedItem -> code select
  const focusedItemRef = useRef<TNodeUid>("");

  const hightlightFocusedNodeSourceCode = useCallback(() => {
    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;
    if (activePanel === "code") return;

    const node = validNodeTree[nFocusedItem];
    const sourceCodeLocation = node.data.sourceCodeLocation;
    if (!sourceCodeLocation) return;

    const {
      startLine: startLineNumber,
      startCol: startColumn,
      endCol: endColumn,
      endLine: endLineNumber,
    } = sourceCodeLocation;

    monacoEditor.setSelection({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    });
    monacoEditor.revealRangeInCenter(
      {
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      },
      1
    );
  }, [validNodeTree, nFocusedItem, activePanel]);

  useEffect(() => {
    if (isCodeTyping || activePanel === "code") return;
    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;

    if (focusedItemRef.current === nFocusedItem) {
      if (!codeSelection) return;

      const node = validNodeTree[nFocusedItem];
      const sourceCodeLocation = node.data.sourceCodeLocation;

      if (!sourceCodeLocation) return;
      const {
        startLine: startLineNumber,
        startCol: startColumn,
        endCol: endColumn,
        endLine: endLineNumber,
      } = sourceCodeLocation;

      monacoEditor.setSelection({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      });
      monacoEditor.setSelection({
        startLineNumber: codeSelection?.startLineNumber,
        startColumn: codeSelection?.startColumn,
        endLineNumber: codeSelection?.endLineNumber,
        endColumn: codeSelection?.endColumn,
      });
      return;
    }
    focusedItemRef.current = nFocusedItem;

    // skip typing in code-view
    if (editingNodeUidInCodeView === nFocusedItem) {
      focusedItemRef.current = nFocusedItem;
      dispatch(setEditingNodeUidInCodeView(""));
      return;
    }

    if (nFocusedItem === RootNodeUid || !validNodeTree[nFocusedItem]) {
      monacoEditor.setSelection({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      });
    } else {
      hightlightFocusedNodeSourceCode();
    }
  }, [nFocusedItem]);

  useEffect(() => {
    if (activePanel === "code" || isCodeTyping || nFocusedItem === "") return;

    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;
    const node = validNodeTree[nFocusedItem];
    if (!node) return;
    const sourceCodeLocation = node.data.sourceCodeLocation;
    if (!sourceCodeLocation) return;
    // skip typing in code-view
    if (editingNodeUidInCodeView === nFocusedItem) {
      focusedItemRef.current = nFocusedItem;
      dispatch(setEditingNodeUidInCodeView(""));
      return;
    }
    const {
      startLine: startLineNumber,
      startCol: startColumn,
      endCol: endColumn,
      endLine: endLineNumber,
    } = sourceCodeLocation;
    monacoEditor.setSelection({
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    });
  }, [nodeTree]);

  // code select -> selectedUids
  useEffect(() => {
    if (!codeSelection || isCodeTyping) return;

    const file = fileTree[currentFileUid];
    if (!file) return;

    const ext = file.data.ext;
    if (ext !== "html") return;

    if (!validNodeTree[RootNodeUid]) return;

    const focusedNodeUid = getNodeUidByCodeSelection(
      codeSelection,
      nodeTree,
      validNodeTree
    );
    if (focusedNodeUid && focusedItemRef.current !== focusedNodeUid) {
      focusedItemRef.current = focusedNodeUid;
      focusedNodeUid && dispatch(setSelectedNodeUids([focusedNodeUid]));
    }
  }, [codeSelection]);

  // show codeView when opening a file without design
  useEffect(() => {
    const fileNode = fileTree[currentFileUid];
    if (!fileNode || showCodeView) return;

    const isCurrentFileHtml = getFileExtension(fileNode) === "html";
    !isCurrentFileHtml && dispatch(setShowCodeView(true));
  }, [currentFileUid]);

  // Sync value (note: this has to come before decorations)
  useEffect(() => {
    const editorModel = monacoEditorRef.current?.getModel();
    if (!editorModel) return;

    if (editorModel.getValue() !== currentFileContent) {
      editorModel.setValue(currentFileContent);
    }
  }, [currentFileContent]);

  // Sync decorations to track node positions
  useEffect(() => {
    const editorModel = monacoEditorRef.current?.getModel();
    if (!editorModel) return;

    const oldDecorations: string[] = [];
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    const allDecorations = editorModel.getAllDecorations();
    const stickiness = monaco.editor.TrackedRangeStickiness;
    nodeUidPositions.forEach((position, uid) => {
      // Check if the editor has an existing decoration
      const id = position.decorationId;
      if (!(id && editorModel.getDecorationOptions(id))) {
        // If not, one needs to be created
        const { startLine, startCol } = position.location;
        const newDecoration: monaco.editor.IModelDeltaDecoration = {
          range: new monaco.Range(startLine, startCol, startLine, startCol + 1),
          // This is important to ensure it tracks properly
          options: { stickiness: stickiness.NeverGrowsWhenTypingAtEdges },
        };
        // These are useful for debug purposes but not for production
        // newDecoration.options.hoverMessage = { value: uid };
        // newDecoration.options.inlineClassName = "uid-decoration";
        setDecorationUid(newDecoration, uid);
        newDecorations.push(newDecoration);
      }
    });
    allDecorations.forEach((decoration) => {
      // Check if this decoration is required
      if (isUidDecoration(decoration)) {
        const uid = getDecorationUid(decoration);
        if (!nodeUidPositions.has(uid)) {
          // If not, it can be deleted
          oldDecorations.push(decoration.id);
        }
      }
    });
    // oldDecorations are removed, neDecorations are added
    editorModel.deltaDecorations(oldDecorations, newDecorations);
  }, [nodeUidPositions]);

  return useMemo(() => {
    // Define transparent theme
    monaco.editor.defineTheme("transparent-theme", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "function", foreground: "DCDCAA" },
      ],
      colors: {
        "editor.background": "#00000000",
        "editor.foreground": "#000000",
        "editor.lineHighlightBackground": "#00000010",
        "editorLineNumber.foreground": "#000000cc",
        "editorCursor.foreground": "#000000",
        "editorIndentGuide.background": "#00000015",
        "editorIndentGuide.activeBackground": "#00000030",
        "editor.selectionBackground": "#0066ff20",
        "editor.inactiveSelectionBackground": "#00000015",
        "editorBracketMatch.background": "#0066ff15",
        "editorBracketMatch.border": "#0066ff40",
      },
    });


    return (
      <>
        <div
          id="CodeView"
          onDragCapture={(e) => {
            e.preventDefault();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          style={{
            width: "100%",
            height: "100%",
            zIndex: 999999,
            overflow: "hidden",
            ...(codeErrors
              ? {
                  outlineWidth: "1px",
                  outlineStyle: "solid",
                  outlineOffset: "-1px",
                  outlineColor: "var(--color-negative)",
                }
              : {}),
            transition: "0.3s all",
            borderLeft: 0,
          }}
          className={`border-left ${codeErrors && "border"}`}
          onClick={onPanelClick}
        >
          <Editor
            onMount={handleEditorDidMount}
            theme="transparent-theme"
            language={language}
            defaultValue={currentFileContent} // Change from defaultValue to value to prevent empty code view content when closing/opening it.
            onChange={(value) => handleOnChange(value, currentFileUid)}
            loading={""}
            options={{
              fontSize: 14,
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              roundedSelection: true,
              padding: { top: 16, bottom: 16 },
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
            }}
            // options={
            //   editorConfigs as monaco.editor.IStandaloneEditorConstructionOptions
            // }
          />
        </div>
      </>
    );
  }, [
    onPanelClick,

    handleEditorDidMount,
    handleOnChange,

    theme,
    language,
    currentFileContent,
    editorConfigs,
    codeErrors,
  ]);
}
