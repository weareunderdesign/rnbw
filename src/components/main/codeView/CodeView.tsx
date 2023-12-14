import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import * as monaco from "monaco-editor";
import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { TFileNodeData, TNodeUid } from "@_node/index";
import { MainContext } from "@_redux/main";
import { setSelectedNodeUids } from "@_redux/main/nodeTree";
import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { Editor, loader } from "@monaco-editor/react";

import { useCmdk, useEditor } from "./hooks";
import { CodeViewProps } from "./types";
import { getNodeUidByCodeSelection } from "./helpers";

loader.config({ monaco });

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch();
  const {
    fileTree,
    currentFileUid,
    currentFileContent,

    validNodeTree,
    nFocusedItem,

    activePanel,
    showCodeView,
  } = useAppState();
  const { isCodeTyping, monacoEditorRef } = useContext(MainContext);

  const {
    handleEditorDidMount,
    handleOnChange,

    theme,

    language,
    updateLanguage,

    editorConfigs,
    setWordWrap,

    codeSelection,
  } = useEditor();
  useCmdk();

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("code"));
  }, []);

  // language sync
  useEffect(() => {
    const file = fileTree[currentFileUid];
    if (!file) return;

    const fileData = file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);
  }, [fileTree, currentFileUid]);

  // focusedItem -> code select
  const focusedItemRef = useRef<TNodeUid>("");
  const hightlightFocusedNodeSourceCode = useCallback(() => {
    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;

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
      1,
    );
  }, [validNodeTree, nFocusedItem, activePanel]);
  useEffect(() => {
    if (focusedItemRef.current === nFocusedItem) return;
    focusedItemRef.current = nFocusedItem;

    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;

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

  // code select -> selectedUids
  useEffect(() => {
    if (!codeSelection || isCodeTyping) return;

    const file = fileTree[currentFileUid];
    if (!file) return;

    if (!validNodeTree[RootNodeUid]) return;

    const focusedNodeUid = getNodeUidByCodeSelection(
      codeSelection,
      validNodeTree,
    );
    if (focusedNodeUid && focusedItemRef.current !== focusedNodeUid) {
      focusedItemRef.current = focusedNodeUid;
      focusedNodeUid && dispatch(setSelectedNodeUids([focusedNodeUid]));
    }
  }, [codeSelection]);

  return useMemo(() => {
    return (
      <>
        <div
          id="CodeView"
          // draggable
          onDrag={props.dragCodeView}
          onDragEnd={props.dragEndCodeView}
          onDrop={props.dropCodeView}
          onDragCapture={(e) => {
            e.preventDefault();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          style={{
            position: "absolute",
            top: props.offsetTop,
            left: props.offsetLeft,
            width: props.width,
            height: showCodeView ? props.height : "0px",
            visibility: showCodeView ? "visible" : "hidden",
            zIndex: 999,
            overflow: "hidden",
            minHeight: showCodeView ? "180px" : "0px",
          }}
          className={
            "border radius-s background-primary shadow" +
            (props.codeViewDragging ? " dragging" : "")
          }
          onClick={onPanelClick}
        >
          <Editor
            onMount={handleEditorDidMount}
            theme={theme}
            language={language}
            defaultValue={""}
            value={currentFileContent}
            onChange={handleOnChange}
            loading={""}
            options={
              editorConfigs as monaco.editor.IStandaloneEditorConstructionOptions
            }
          />
        </div>
      </>
    );
  }, [
    props,
    onPanelClick,
    showCodeView,

    handleEditorDidMount,
    handleOnChange,

    theme,
    language,
    currentFileContent,
    editorConfigs,
  ]);
}
