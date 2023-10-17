import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { IPosition, IRange, editor } from "monaco-editor";
import {
  MainContext,
  navigatorSelector,
  setCurrentFileContent,
} from "@_redux/main";

import { DefaultTabSize, RootNodeUid } from "@_constants/main";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { THtmlNodeData, checkValidHtml } from "@_node/html";
import { getPositionFromIndex } from "@_services/htmlapi";
import { CodeSelection } from "../types";
import { getLineBreaker } from "@_services/global";
import { TCodeChange } from "@_types/main";
import { TFileNodeData } from "@_node/file";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

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
  const {
    tabSize,
    setTabSize,
    codeEditing,
    setCodeEditing,
    parseFileFlag,
    validNodeTree,
    ffTree,
    setActivePanel,
    osType,
    setCodeChanges,
    addRunningActions,
    setUpdateOpt,
    setFSPending,
    setFFTree,
    setMonacoEditorRef,
  } = useContext(MainContext);
  const { file } = useSelector(navigatorSelector);

  const dispatch = useDispatch();

  const [focusedNode, setFocusedNode] = useState<TNode>();
  const wordWrap: editor.IEditorOptions["wordWrap"] = "off";

  const editorConfigs = {
    contextmenu: true,
    tabSize,
    wordWrap,
    minimap: { enabled: false },
    automaticLayout: true,
    selectionHighlight: false,
  };
  const codeContent = useRef<string>("");

  const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const codeChangeDecorationRef = useRef<
    Map<TNodeUid, editor.IModelDeltaDecoration[]>
  >(new Map<TNodeUid, editor.IModelDeltaDecoration[]>());
  const validNodeTreeRef = useRef<TNodeTreeData>({});
  const reduxTimeout = useRef<NodeJS.Timeout | null>(null);
  const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection>();
  const currentPosition = useRef<IPosition | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    monacoRef.current = editor;
    setMonacoEditorRef(editor);

    setUpdateOpt({ parse: true, from: "file" });
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

  function getCodeChangeDecorationInstance() {
    return codeChangeDecorationRef.current;
  }

  function getValidNodeTreeInstance() {
    return validNodeTreeRef;
  }
  // panel focus handler
  function onPanelClick() {
    setActivePanel("code");
  }

  function findNodeBySelection(
    selection: CodeSelection,
    validNodeTree: TNodeTreeData,
    monacoEditor: editor.IStandaloneCodeEditor | null,
  ): TNode | null {
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
        focusedNode = structuredClone(node);
      }
    }
    return focusedNode;
  }

  const saveFileContentToRedux = useCallback(() => {
    onPanelClick();
    if (parseFileFlag) {
      // clear highlight
      decorationCollectionRef.current?.clear();

      // skip same content
      const _file = ffTree[file.uid];
      const fileData = _file.data as TFileNodeData;
      if (fileData.content === codeContent.current) {
        validNodeTreeRef.current = structuredClone(validNodeTree);

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
            const editor = monacoEditor as editor.IStandaloneCodeEditor;
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
        const _file = structuredClone(ffTree[file.uid]) as TNode;
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
      const _file = structuredClone(ffTree[file.uid]) as TNode;
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
    (value: string | undefined, ev: editor.IModelContentChangedEvent) => {
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
        const n_range: IRange = {
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
          const focusedNodeDecorations: editor.IModelDeltaDecoration[] = [];
          const { startIndex, endIndex } = validNodeTreeRef.current[
            focusedNode.uid
          ].data as THtmlNodeData;
          const editor = monacoEditor;
          if (!editor) return;
          if (startIndex && endIndex) {
            const { startLineNumber, startColumn, endLineNumber, endColumn } =
              getPositionFromIndex(editor, startIndex, endIndex);
            const focusedNodeCodeRange: IRange = {
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

          const wholeDecorations: editor.IModelDeltaDecoration[] = [];
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
    getCodeChangeDecorationInstance,
    getValidNodeTreeInstance,
    decorationCollectionRef,
    currentPosition,
    handleEditorDidMount,
    language,
    updateLanguage,
    editorConfigs,
    findNodeBySelection,
    codeEditing,
    setCodeEditing,
    handleEditorChange,
    updateFileContentOnRedux,
    focusedNode,
    setFocusedNode,
  };
}
