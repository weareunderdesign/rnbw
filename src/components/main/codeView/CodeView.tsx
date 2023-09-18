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
import {
  checkValidHtml,
  getSubNodeUidsByBfs,
  TFileNodeData,
  THtmlNodeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from "@_node/index";
import {
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
  setCurrentFileContent,
} from "@_redux/main";
import { getLineBreaker } from "@_services/global";
import { TCodeChange } from "@_types/main";
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
    // global action
    addRunningActions,
    // node actions
    setFSPending,
    ffTree,
    setFFTree,
    validNodeTree,
    // code view
    setCodeChanges,
    tabSize,
    setTabSize,
    newFocusedNodeUid,
    setNewFocusedNodeUid,
    // processor
    updateOpt,
    setUpdateOpt,
    osType,
    theme: _theme,
    parseFileFlag,
  } = useContext(MainContext);
  // -------------------------------------------------------------- references --------------------------------------------------------------

  // ----------------------------------------------------------custom Hooks---------------------------------------------------------------
  const { theme } = useTheme();
  const {
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
  } = useEditor();

  const { editorWrapperRef, onPanelClick } = useEditorWrapper(
    getCurrentEditorInstance(),
  );
  //-----------------------------------------

  const isFirst = useRef<boolean>(true);

  const codeContent = useRef<string>("");
  const previewDiv = useRef(null);

  const codeChangeDecorationRef = useRef<
    Map<TNodeUid, monaco.editor.IModelDeltaDecoration[]>
  >(new Map<TNodeUid, monaco.editor.IModelDeltaDecoration[]>());

  const validNodeTreeRef = useRef<TNodeTreeData>({});

  // -------------------------------------------------------------- sync --------------------------------------------------------------

  // build node tree reference
  useEffect(() => {
    validNodeTreeRef.current = JSON.parse(JSON.stringify(validNodeTree));

    // set new focused node
    if (newFocusedNodeUid !== "") {
      setFocusedNode(validNodeTree[newFocusedNodeUid]);
      !isFirst.current ? (focusedItemRef.current = newFocusedNodeUid) : null;
      setNewFocusedNodeUid("");
    }
  }, [validNodeTree]);

  // file content change - set code
  useEffect(() => {
    const _file = ffTree[file.uid];
    if (!_file) return;

    if (updateOpt.from === "code") return;

    const fileData = _file.data as TFileNodeData;
    const extension = fileData.ext;
    extension && updateLanguage(extension);

    codeContent.current = fileData.content;
  }, [ffTree[file.uid]]);

  // focusedItem - code select
  const focusedItemRef = useRef<TNodeUid>("");
  const revealed = useRef<boolean>(false);

  useEffect(() => {
    if (!parseFileFlag) {
      return;
    }

    if (focusedItem === RootNodeUid || focusedItemRef.current === focusedItem)
      return;
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
      debugger;
      const firstTimer = setInterval(() => {
        const monacoEditor = getCurrentEditorInstance();
        if (monacoEditor) {
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
  const [focusedNode, setFocusedNode] = useState<TNode>();

  useEffect(() => {
    if (!parseFileFlag) return;
    if (!selection) return;

    const _file = ffTree[file.uid];
    if (!_file) return;

    // this means, code view is already opened before file read
    if (!validNodeTreeRef.current[RootNodeUid]) return;

    // avoid loop when reveal focused node's code block
    if (revealed.current === true) {
      revealed.current = false;
      return;
    }
    const monacoEditor = getCurrentEditorInstance();
    if (selection) {
      let focusedNode = findNodeBySelection(
        selection,
        validNodeTreeRef.current,
        monacoEditor,
      );
      if (focusedNode) {
        setFocusedNode(focusedNode);
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

  // code edit - highlight/parse
  const reduxTimeout = useRef<NodeJS.Timeout | null>(null);

  const saveFileContentToRedux = useCallback(() => {
    onPanelClick();
    if (parseFileFlag) {
      // clear highlight
      decorationCollectionRef.current?.clear();

      // skip same content
      const _file = ffTree[file.uid];
      const fileData = _file.data as TFileNodeData;
      if (fileData.content === codeContent.current) {
        validNodeTreeRef.current = JSON.parse(JSON.stringify(validNodeTree));

        codeChangeDecorationRef.current.clear();
        setCodeEditing(false);
        return;
      }

      // get code changes
      const currentCode = codeContent.current;
      const currentCodeArr = currentCode.split(getLineBreaker(osType));
      const codeChanges: TCodeChange[] = [];
      let hasMismatchedTags = false;
      const monacoEditor = getCurrentEditorInstance();
      for (const codeChange of codeChangeDecorationRef.current.entries()) {
        let uid = codeChange[0];
        // check if editing tags are <code> or <pre>
        let _parent = uid;
        if (validNodeTree[uid] === undefined) return;
        let notParsingFlag =
          validNodeTree[uid].name === "code" ||
          validNodeTree[uid].name === "pre"
            ? true
            : false;
        while (
          _parent !== undefined &&
          _parent !== null &&
          _parent !== "ROOT"
        ) {
          if (
            validNodeTree[_parent].name === "code" ||
            validNodeTree[_parent].name === "pre"
          ) {
            notParsingFlag = true;
            break;
          }
          _parent = validNodeTree[_parent].parentUid as TNodeUid;
        }
        let { startLineNumber, startColumn, endLineNumber, endColumn } =
          codeChange[1][0].range;
        if (notParsingFlag) {
          if (validNodeTree[_parent]) {
            const { startIndex, endIndex } = validNodeTree[_parent]
              .data as THtmlNodeData;
            const editor = monacoEditor as monaco.editor.IStandaloneCodeEditor;
            const {
              startLineNumber: startLine,
              startColumn: startCol,
              endLineNumber: endLine,
              endColumn: endCol,
            } = getPositionFromIndex(
              editor,
              startIndex as number,
              endIndex as number,
            );
            startLineNumber = startLine;
            startColumn = startCol;
            endLineNumber = endLine;
            endColumn = endCol;
          }
        }
        const partCodeArr: string[] = [];
        partCodeArr.push(
          currentCodeArr[startLineNumber !== 0 ? startLineNumber - 1 : 0].slice(
            startColumn !== 0 ? startColumn - 1 : 0,
          ),
        );
        for (
          let line = startLineNumber - 1 + 1;
          line < endLineNumber - 1;
          ++line
        ) {
          partCodeArr.push(currentCodeArr[line]);
        }
        endLineNumber > startLineNumber &&
          partCodeArr.push(
            currentCodeArr[endLineNumber - 1].slice(0, endColumn - 1),
          );
        const content = partCodeArr.join(getLineBreaker(osType));

        uid = notParsingFlag ? _parent : uid;
        checkValidHtml(codeContent.current);
        codeChanges.push({ uid, content });
      }

      if (hasMismatchedTags === false) {
        setCodeChanges(codeChanges);

        // update
        dispatch(setCurrentFileContent(codeContent.current));
        addRunningActions(["processor-updateOpt"]);
        setUpdateOpt({ parse: true, from: "code" });

        codeChangeDecorationRef.current.clear();
        reduxTimeout.current = null;
        setFocusedNode(undefined);
      } else {
        // update
        dispatch(setCurrentFileContent(codeContent.current));
        setFSPending(false);
        const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
        addRunningActions(["processor-updateOpt"]);
        const fileData = _file.data as TFileNodeData;
        (ffTree[file.uid].data as TFileNodeData).content = codeContent.current;
        (ffTree[file.uid].data as TFileNodeData).contentInApp =
          codeContent.current;
        (ffTree[file.uid].data as TFileNodeData).changed =
          codeContent.current !== fileData.orgContent;
        setFFTree(ffTree);
        dispatch(setCurrentFileContent(codeContent.current));
        codeChangeDecorationRef.current.clear();
        setCodeEditing(false);
        setFSPending(false);
      }
    } else {
      // non-parse file save
      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
      addRunningActions(["processor-updateOpt"]);
      const fileData = _file.data as TFileNodeData;
      (ffTree[file.uid].data as TFileNodeData).content = codeContent.current;
      (ffTree[file.uid].data as TFileNodeData).contentInApp =
        codeContent.current;
      (ffTree[file.uid].data as TFileNodeData).changed =
        codeContent.current !== fileData.orgContent;
      setFFTree(ffTree);
      dispatch(setCurrentFileContent(codeContent.current));
      codeChangeDecorationRef.current.clear();
      setCodeEditing(false);
      setFSPending(false);
    }
  }, [ffTree, file.uid, validNodeTree, osType, parseFileFlag]);

  const handleEditorChange = useCallback(
    (
      value: string | undefined,
      ev: monaco.editor.IModelContentChangedEvent,
    ) => {
      const monacoEditor = getCurrentEditorInstance();
      let delay = 1;
      if (parseFileFlag) {
        const hasFocus = monacoEditor?.hasTextFocus();

        if (!hasFocus) return;

        if (!focusedNode) return;

        // get changed part
        const { eol } = ev;
        const { range: o_range, text: changedCode } = ev.changes[0];
        if (
          (changedCode === " " ||
            changedCode === "=" ||
            changedCode === '"' ||
            changedCode === '""' ||
            changedCode === "''" ||
            changedCode === "'" ||
            changedCode.search('=""') !== -1) &&
          parseFileFlag
        ) {
          delay = 1;
        } else {
          reduxTimeout.current !== null && clearTimeout(reduxTimeout.current);
          delay = 1;
        }
        const o_rowCount = o_range.endLineNumber - o_range.startLineNumber + 1;

        const changedCodeArr = changedCode.split(eol);
        const n_rowCount = changedCodeArr.length;
        const n_range: monaco.IRange = {
          startLineNumber: o_range.startLineNumber,
          startColumn: o_range.startColumn,
          endLineNumber: o_range.startLineNumber + n_rowCount - 1,
          endColumn:
            n_rowCount === 1
              ? o_range.startColumn + changedCode.length
              : (changedCodeArr.pop() as string).length + 1,
        };
        const columnOffset =
          (o_rowCount === 1 && n_rowCount > 1 ? -1 : 1) *
          (n_range.endColumn - o_range.endColumn);

        // update code range for node tree
        const focusedNodeData = focusedNode.data as THtmlNodeData;
        const uids = getSubNodeUidsByBfs(RootNodeUid, validNodeTreeRef.current);
        let completelyRemoved = false;

        uids.map((uid) => {
          const node = validNodeTreeRef.current[uid];

          if (!node) return;

          const nodeData = node.data as THtmlNodeData;
          const { startIndex, endIndex } = nodeData;
          const editor = monacoEditor;
          if (!editor) return;

          if (startIndex === undefined || endIndex === undefined) return;

          const { startLineNumber, startColumn, endLineNumber, endColumn } =
            getPositionFromIndex(editor, startIndex, endIndex);
          const {
            startLineNumber: focusedNodeStartLineNumber,
            startColumn: focusedNodeStartColumn,
            endLineNumber: focusedNodeEndLineNumber,
            endColumn: focusedNodeEndColumn,
          } = getPositionFromIndex(
            editor,
            focusedNodeData.startIndex as number,
            focusedNodeData.endIndex as number,
          );
          const containFront =
            focusedNodeStartLineNumber === startLineNumber
              ? focusedNodeStartColumn >= startColumn
              : focusedNodeStartLineNumber > startLineNumber;
          const containBack =
            focusedNodeEndLineNumber === endLineNumber
              ? focusedNodeEndColumn <= endColumn
              : focusedNodeEndLineNumber < endLineNumber;

          let {
            startLineNumber: nodeDataStartLineNumber,
            startColumn: nodeDataStartColumn,
            endLineNumber: nodeDataEndLineNumber,
            endColumn: nodeDataEndColumn,
          } = getPositionFromIndex(
            editor,
            nodeData.startIndex as number,
            nodeData.endIndex as number,
          );
          if (containFront && containBack) {
            nodeDataEndLineNumber += n_rowCount - o_rowCount;
            nodeDataEndColumn +=
              endLineNumber === o_range.endLineNumber ? columnOffset : 0;

            if (
              nodeDataEndLineNumber === nodeDataStartLineNumber &&
              nodeDataEndColumn === nodeDataStartColumn
            ) {
              const parentNode =
                validNodeTreeRef.current[focusedNode.parentUid as TNodeUid];
              parentNode.children = parentNode.children.filter(
                (c_uid) => c_uid !== focusedNode.uid,
              );

              const subNodeUids = getSubNodeUidsByBfs(
                focusedNode.uid,
                validNodeTreeRef.current,
              );
              subNodeUids.map((uid) => {
                codeChangeDecorationRef.current.delete(uid);
                delete validNodeTreeRef.current[uid];
              });

              completelyRemoved = true;
            }
          } else if (containBack) {
            nodeDataStartLineNumber += n_rowCount - o_rowCount;
            nodeDataStartColumn +=
              startLineNumber === o_range.endLineNumber ? columnOffset : 0;
            nodeDataEndLineNumber += n_rowCount - o_rowCount;
            nodeDataEndColumn +=
              endLineNumber === o_range.endLineNumber ? columnOffset : 0;
          }
        });
        if (!completelyRemoved) {
          const subNodeUids = getSubNodeUidsByBfs(
            focusedNode.uid,
            validNodeTreeRef.current,
            false,
          );
          subNodeUids.map((uid) => {
            codeChangeDecorationRef.current.delete(uid);

            const node = validNodeTreeRef.current[uid];
            const nodeData = node.data as THtmlNodeData;

            nodeData.startIndex = 0;
            nodeData.endIndex = 0;
          });
        }

        // update decorations
        if (validNodeTreeRef.current[focusedNode.uid]) {
          const focusedNodeDecorations: monaco.editor.IModelDeltaDecoration[] =
            [];
          const { startIndex, endIndex } = validNodeTreeRef.current[
            focusedNode.uid
          ].data as THtmlNodeData;
          const editor = monacoEditor;
          if (!editor) return;
          if (startIndex && endIndex) {
            const { startLineNumber, startColumn, endLineNumber, endColumn } =
              getPositionFromIndex(editor, startIndex, endIndex);
            const focusedNodeCodeRange: monaco.IRange = {
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn,
            };
            if (!completelyRemoved) {
              focusedNodeDecorations.push({
                range: focusedNodeCodeRange,
                options: {
                  isWholeLine: true,
                  className: "focusedNodeCode",
                },
              });
            }
            codeChangeDecorationRef.current.set(
              focusedNode.uid,
              focusedNodeDecorations,
            );
          }

          // render decorations
          const decorationsList = codeChangeDecorationRef.current.values();

          const wholeDecorations: monaco.editor.IModelDeltaDecoration[] = [];
          for (const decorations of decorationsList) {
            wholeDecorations.push(...decorations);
          }
          decorationCollectionRef.current?.set(wholeDecorations);
        }
      }
      // update redux with debounce
      codeContent.current = value || "";
      const newPosition = monacoEditor?.getPosition();
      if (newPosition !== undefined) {
        currentPosition.current = newPosition;
      }

      reduxTimeout.current !== null && clearTimeout(reduxTimeout.current);
      reduxTimeout.current = setTimeout(saveFileContentToRedux, delay);

      setCodeEditing(true);
    },
    [saveFileContentToRedux, focusedNode, parseFileFlag],
  );

  // -------------------------------------------------------------- monaco-editor options --------------------------------------------------------------

  // theme

  // tabSize

  // -------------------------------------------------------------- other --------------------------------------------------------------

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
          {/* <div 
          id="CodeViewHeader"
          style={{
            width: '100%',
            height: '23px',
            cursor: 'move',
            paddingTop: '5px',
            paddingLeft: '12px'
          }}
        >
          <SVGIconI {...{ "class": "icon-xs" }}>list</SVGIconI>
        </div> */}
          <Editor
            language={language}
            defaultValue={""}
            value={codeContent.current}
            theme={theme}
            // line={line}
            // beforeMount={() => {}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            loading={""}
            options={editorConfigs}
          />
        </div>
        <div
          ref={previewDiv}
          id="codeview_change_preview"
          style={{ display: "none" }}
        ></div>
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
