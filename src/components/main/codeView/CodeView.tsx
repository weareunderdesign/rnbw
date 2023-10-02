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
import { TFileNodeData, THtmlNodeData, TNodeUid } from "@_node/index";
import {
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from "@_redux/main";

import { Editor, loader } from "@monaco-editor/react";

import { CodeSelection, CodeViewProps } from "./types";
import { getPositionFromIndex } from "@_services/htmlapi";
import { useTheme } from "@_hooks/useTheme";
import { useEditor, useEditorWrapper } from "./hooks";

loader.config({ monaco });

export default function CodeView(props: CodeViewProps) {
  const dispatch = useDispatch();
  // -------------------------------------------------------------- global state --------------------------------------------------------------

  const { file } = useSelector(navigatorSelector);
  const { focusedItem } = useSelector(fnSelector);
  const {
    ffTree,
    validNodeTree,
    // code view
    newFocusedNodeUid,
    setNewFocusedNodeUid,
    // processor
    updateOpt,
    theme: _theme,
    parseFileFlag,
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
    codeEditing,
    handleEditorChange,
    focusedNode,
    setFocusedNode,
  } = useEditor();

  const { editorWrapperRef, onPanelClick } = useEditorWrapper(
    getCurrentEditorInstance(),
  );
  //-----------------------------------------

  const isFirst = useRef<boolean>(true);

  const [codeContent, setCodeContent] = useState<string>("");
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
    const _file = ffTree[file.uid];

    if (!_file) return;

    if (updateOpt.from === "code") return;

    const fileData = _file.data as TFileNodeData;

    const extension = fileData.ext;
    extension && updateLanguage(extension);

    setCodeContent(fileData.content);
  }, [ffTree[file.uid]]);

  // focusedItem - code select
  const focusedItemRef = useRef<TNodeUid>("");
  const revealed = useRef<boolean>(false);

  useEffect(() => {
    if (!parseFileFlag) {
      return;
    }

    // if (focusedItem === RootNodeUid || focusedItemRef.current === focusedItem)
    if (focusedItem === RootNodeUid) return;

    if (!validNodeTree[focusedItem]) return;

    if (codeEditing) return;

    // Convert the indices to positions

    const monacoEditor = getCurrentEditorInstance();
    if (!monacoEditor) return;

    const node = validNodeTree[focusedItem];

    const { startIndex, endIndex } = node.data as THtmlNodeData;

    if (!startIndex || !endIndex) return;

    const { startLineNumber, startColumn, endLineNumber, endColumn } =
      getPositionFromIndex(monacoEditor, startIndex, endIndex);

    if (isFirst.current) {
      // debugger;
      const firstTimer = setInterval(() => {
        const newMonacoEditor = getCurrentEditorInstance();
        if (newMonacoEditor) {
          newMonacoEditor.setSelection({
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          });
          newMonacoEditor.revealRangeInCenter(
            {
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn,
            },
            1,
          );
          revealed.current = false;
          clearInterval(firstTimer);
        }
      }, 0);
    } else {
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
      revealed.current = true;
    }

    focusedItemRef.current = focusedItem;
  }, [focusedItem, parseFileFlag]);

  // watch focus/selection for the editor
  const firstSelection = useRef<CodeSelection | null>(null);
  const [selection, setSelection] = useState<CodeSelection | null>(null);

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

  useEffect(() => {
    const cursorDetectInterval = setInterval(() => updateSelection(), 0);

    return () => clearInterval(cursorDetectInterval);
  }, [updateSelection]);
  // detect node of current selection

  useEffect(() => {
    if (!parseFileFlag) return;
    if (!selection) return;

    const _file = ffTree[file.uid];
    if (!_file) return;

    const validNodeTreeRef = getValidNodeTreeInstance();
    // this means, code view is already opened before file read
    if (!validNodeTreeRef.current[RootNodeUid]) return;

    // avoid loop when reveal focused node's code block
    if (revealed.current === true) {
      revealed.current = false;
      return;
    }
    const monacoEditor = getCurrentEditorInstance();
    if (selection) {
      let newFocusedNode = findNodeBySelection(
        selection,
        validNodeTreeRef.current,
        monacoEditor,
      );
      if (newFocusedNode) {
        setFocusedNode(newFocusedNode);
      }
    }
  }, [selection, parseFileFlag]);

  useEffect(() => {
    if (focusedNode) {
      if (focusedNode.uid === focusedItemRef.current) return;
      if (updateOpt.from === "hms") return;
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
      dispatch(expandFNNode(_expandedItems));
      dispatch(focusFNNode(focusedNode.uid));
      dispatch(selectFNNode([focusedNode.uid]));
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
            height: props.height,
            zIndex: 999,
            overflow: "hidden",
            minHeight: "180px",
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
            onChange={handleEditorChange}
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
