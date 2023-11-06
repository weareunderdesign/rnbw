import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as monaco from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { useTheme } from "@_hooks/useTheme";
import { TFileNodeData, TNodeUid } from "@_node/index";
import { MainContext } from "@_redux/main";
import { Editor, loader } from "@monaco-editor/react";

import { useEditor, useEditorWrapper } from "./hooks";
import { CodeViewProps } from "./types";
import { codeEditingSelector } from "@_redux/main/codeView";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import {
  showCodeViewSelector,
  updateOptionsSelector,
} from "@_redux/main/processor";
import {
  currentFileUidSelector,
  fileTreeSelector,
} from "@_redux/main/fileTree";

import { AppState } from "@_redux/_root";

loader.config({ monaco });

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch();
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const showCodeView = useSelector(showCodeViewSelector);
  const { focusedItem } = useSelector(
    (state: AppState) => state.main.nodeTree.nodeTreeViewState,
  );
  const {
    // code view
    newFocusedNodeUid,
    setNewFocusedNodeUid,
    // processor
    parseFileFlag,
    isContentProgrammaticallyChanged,
    monacoEditorRef,
  } = useContext(MainContext);
  // -------------------------------------------------------------- references --------------------------------------------------------------

  // ----------------------------------------------------------custom Hooks---------------------------------------------------------------
  const { theme } = useTheme();
  const {
    getCurrentEditorInstance,
    getValidNodeTreeInstance,
    handleEditorDidMount,
    language,
    updateLanguage,
    editorConfigs,
    findNodeBySelection,
    handleEditorChange,
    focusedNode,
    setFocusedNode,
    codeContent,
    setCodeContent,
    selection,
  } = useEditor();
  const codeEditing = useSelector(codeEditingSelector);
  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);
  const { editorWrapperRef, onPanelClick } = useEditorWrapper();
  //-----------------------------------------
  const validNodeTree = useSelector(validNodeTreeSelector);
  const updateOptions = useSelector(updateOptionsSelector);
  const isFirst = useRef<boolean>(true);

  const previewDiv = useRef(null);

  // -------------------------------------------------------------- sync --------------------------------------------------------------

  // build node tree reference
  useEffect(() => {
    const validNodeTreeRef = getValidNodeTreeInstance();
    validNodeTreeRef.current = structuredClone(validNodeTree);

    // set new focused node
    if (newFocusedNodeUid == "") return;

    setFocusedNode(validNodeTree[newFocusedNodeUid]);
    !isFirst.current ? (focusedItemRef.current = newFocusedNodeUid) : null;
    setNewFocusedNodeUid("");
  }, [validNodeTree]);

  // file content change - set code
  useEffect(() => {
    console.log(fileTree);
  }, [fileTree]);
  useEffect(() => {
    const _file = fileTree[currentFileUid];

    if (!_file) return;

    if (!updateOptions || updateOptions.from === "code") return;

    const fileData = _file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);

    setCodeContent(fileData.content);
  }, [currentFileUid]);

  // focusedItem - code select
  const focusedItemRef = useRef<TNodeUid>("");
  const revealed = useRef<boolean>(false);

  function hightlightFocusedNodeCodeBlock() {
    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;
    const node = validNodeTree[focusedItem];

    const sourceCodeLocation = node.data.sourceCodeLocation;

    if (!sourceCodeLocation) {
      return;
    }

    let {
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
    monacoEditor?.revealRangeInCenter(
      {
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      },
      1,
    );
  }

  useEffect(() => {
    if (!parseFileFlag) {
      return;
    }

    if (focusedItem === RootNodeUid) return;
    if (!validNodeTree[focusedItem]) return;

    if (codeEditing) return;
    // Convert the indices to positions

    const monacoEditor = getCurrentEditorInstance();
    if (!monacoEditor) return;

    if (isFirst.current) {
      const firstTimer = setInterval(() => {
        const monacoEditor = getCurrentEditorInstance();
        if (monacoEditor) {
          hightlightFocusedNodeCodeBlock();
          revealed.current = false;
          clearInterval(firstTimer);
        }
      }, 0);
    } else {
      hightlightFocusedNodeCodeBlock();
      revealed.current = true;
    }
    focusedItemRef.current = focusedItem;
  }, [focusedItem, parseFileFlag]);

  useEffect(() => {
    if (!parseFileFlag) return;
    if (!selection) return;

    const _file = fileTree[currentFileUid];
    if (!_file) return;

    const validNodeTreeRef = getValidNodeTreeInstance();
    // this means, code view is already opened before file read
    if (!validNodeTreeRef.current[RootNodeUid]) return;

    // avoid loop when reveal focused node's code block
    if (revealed.current === true) {
      revealed.current = false;
      return;
    }

    if (selection) {
      let newFocusedNode = findNodeBySelection(
        selection,
        validNodeTreeRef.current,
      );
      if (newFocusedNode) {
        setFocusedNode(newFocusedNode);
      }
    }
  }, [selection, parseFileFlag]);

  useEffect(() => {
    if (focusedNode) {
      if (focusedNode.uid === focusedItemRef.current) return;
      if (!updateOptions || updateOptions.from === "hms") return;
      // expand path to the uid
      const _expandedItems: TNodeUid[] = [];
      let node = validNodeTree[focusedNode.uid];
      if (!node) {
        return;
      }
      while (node.uid !== RootNodeUid) {
        _expandedItems.push(node.uid);
        node = validNodeTree[node.parentUid as TNodeUid];
      }
      _expandedItems.shift();
      dispatch(expandNodeTreeNodes(_expandedItems));
      dispatch(focusNodeTreeNode(focusedNode.uid));
      dispatch(selectNodeTreeNodes([focusedNode.uid]));
      focusedItemRef.current = focusedNode.uid;
    }
  }, [focusedNode]);

  //-------------------------------------------------------------- other --------------------------------------------------------------

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
          ref={editorWrapperRef}
        >
          <Editor
            language={language}
            defaultValue={""}
            value={codeContent}
            theme={theme}
            onMount={handleEditorDidMount}
            onChange={(value) => {
              if (isContentProgrammaticallyChanged.current) return;
              handleEditorChange(value);
            }}
            loading={""}
            options={
              editorConfigs as monaco.editor.IStandaloneEditorConstructionOptions
            }
          />
        </div>
        <div
          ref={previewDiv}
          id="codeview_change_preview"
          style={{ display: "none" }}
        />
      </>
    );
  }, [
    props,
    onPanelClick,
    language,
    theme,
    handleEditorDidMount,
    handleEditorChange,
    parseFileFlag,
  ]);
}
