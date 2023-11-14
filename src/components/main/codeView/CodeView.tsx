import React, { useContext, useEffect, useMemo, useRef } from "react";

import * as monaco from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { useTheme } from "@_hooks/useTheme";
import { TFileNodeData, TNodeUid } from "@_node/index";
import { MainContext } from "@_redux/main";
import { codeEditingSelector } from "@_redux/main/codeView";
import {
  currentFileUidSelector,
  fileTreeSelector,
} from "@_redux/main/fileTree";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNewFocusedNodeUid,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import { updateOptionsSelector } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { Editor, loader } from "@monaco-editor/react";

import { useEditor, useEditorWrapper } from "./hooks";
import { CodeViewProps } from "./types";

loader.config({ monaco });

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch();
  const { nFocusedItem, newFocusedNodeUid, activePanel, showCodeView } =
    useAppState();
  const { parseFileFlag, isContentProgrammaticallyChanged, monacoEditorRef } =
    useContext(MainContext);

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
    dispatch(setNewFocusedNodeUid(""));
  }, [validNodeTree]);

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
    const node = validNodeTree[nFocusedItem];

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

    if (activePanel !== "code") {
      monacoEditor.setSelection({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      });
    }

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

    if (nFocusedItem === RootNodeUid) return;
    if (!validNodeTree[nFocusedItem]) return;

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
    focusedItemRef.current = nFocusedItem;
  }, [nFocusedItem, parseFileFlag]);

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
