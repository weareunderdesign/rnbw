import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { debounce } from "lodash";
import { editor, IPosition } from "monaco-editor";
import morphdom from "morphdom";
import * as parse5 from "parse5";
import { useDispatch, useSelector } from "react-redux";

import { DefaultTabSize, RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { parseFile, TFileNodeData } from "@_node/file";
import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setCodeEditing, setCodeViewTabSize } from "@_redux/main/codeView";
import {
  currentFileUidSelector,
  fileTreeSelector,
  setDoingFileAction,
  setFileTree,
} from "@_redux/main/fileTree";
import {
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNodeTree,
} from "@_redux/main/nodeTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";

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
  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);
  const {
    addRunningActions,
    setMonacoEditorRef,
    setIsContentProgrammaticallyChanged,
    monacoEditorRef,
    parseFileFlag,
  } = useContext(MainContext);

  const dispatch = useDispatch();

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
  const codeContentRef = useRef<string>("");

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

    // dispatch(setUpdateOptions({ parse: true, from: "file" }));
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

  const debouncedEditorUpdate = useCallback(
    debounce((value: string, configs) => {
      const monacoEditor = monacoEditorRef.current;
      if (!monacoEditor) return;
      const iframe: any = document.getElementById("iframeId");
      const iframeDoc = iframe.contentDocument;
      const iframeHtml = iframeDoc.getElementsByTagName("html")[0];
      const { htmlDom, nodeTree } = parseFile("html", value);

      let updatedHtml = null;
      if (!htmlDom) return;
      const defaultTreeAdapter = parse5.defaultTreeAdapter;
      const htmlNode = defaultTreeAdapter
        .getChildNodes(htmlDom)
        .filter(defaultTreeAdapter.isElementNode)[0];

      if (htmlNode) {
        updatedHtml = parse5.serialize(htmlDom);
      }
      if (!iframeHtml || !updatedHtml) return;

      try {
        let nodeUidToFocus = "";
        morphdom(iframeHtml, updatedHtml, {
          onBeforeElUpdated: function (fromEl, toEl) {
            //check if the node is script or style
            if (
              fromEl.nodeName === "SCRIPT" ||
              fromEl.nodeName === "STYLE" ||
              fromEl.nodeName === "LINK"
            ) {
              return false;
            }
            const fromElRnbwId = fromEl.getAttribute(StageNodeIdAttr);
            nodeUidToFocus = configs?.matchIds?.[0] || "";
            if (toEl.nodeName.includes("-")) return false;
            if (
              configs?.matchIds &&
              !!fromElRnbwId &&
              configs.matchIds.includes(fromElRnbwId)
            ) {
              return true;
            } else if (fromEl.isEqualNode(toEl)) {
              return false;
            } else if (toEl.nodeName === "HTML") {
              //copy the attributes
              for (let i = 0; i < fromEl.attributes.length; i++) {
                toEl.setAttribute(
                  fromEl.attributes[i].name,
                  fromEl.attributes[i].value,
                );
              }
              if (fromEl.isEqualNode(toEl)) return false;
            }
            return true;
          },
          onElUpdated: function (el) {
            if (el.nodeName === "HTML") {
              //copy the attributes
              for (let i = 0; i < el.attributes.length; i++) {
                iframeHtml.setAttribute(
                  el.attributes[i].name,
                  el.attributes[i].value,
                );
              }
            }
          },
          onBeforeNodeDiscarded: function (node: Node) {
            //script and style should not be discarded
            if (
              node.nodeName === "SCRIPT" ||
              node.nodeName === "STYLE" ||
              node.nodeName === "LINK"
            ) {
              return false;
            }
            return true;
          },
        });

        codeContentRef.current = value;
        dispatch(setNodeTree(nodeTree));

        dispatch(setCurrentFileContent(codeContentRef.current));
        dispatch(setDoingFileAction(false));

        const _file = structuredClone(fileTree[currentFileUid]) as TNode;
        addRunningActions(["processor-updateOpt"]);
        const fileData = _file.data as TFileNodeData;
        dispatch(setCurrentFileContent(codeContentRef.current));

        // (fileTree[currentFileUid].data as TFileNodeData).contentInApp =
        //   codeContentRef.current;
        // (fileTree[currentFileUid].data as TFileNodeData).changed =
        //   codeContentRef.current !== fileData.orgContent;

        dispatch(setFileTree(fileTree));
        dispatch(setCurrentFileContent(codeContentRef.current));
        codeChangeDecorationRef.current.clear();

        dispatch(setCodeEditing(false));
        dispatch(setDoingFileAction(false));

        //finding and selecting focused node
        const focusedNode = nodeTree[nodeUidToFocus];
        if (!!focusedNode) {
          dispatch(focusNodeTreeNode(focusedNode.uid));
          dispatch(selectNodeTreeNodes([focusedNode.uid]));
        }
      } catch (e) {
        console.log(e);
      }

      dispatch(setCodeEditing(false));
    }, 1000),
    [dispatch, fileTree, monacoEditorRef, currentFileUid, addRunningActions],
  );

  const handleEditorChange = useCallback(
    (
      value: string | undefined,
      configs?: {
        matchIds?: string[] | null;
        skipFromChildren?: boolean;
      },
    ) => {
      if (!value) return;
      debouncedEditorUpdate(value, configs);
      setIsContentProgrammaticallyChanged(false);
    },
    [debouncedEditorUpdate],
  );

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
    setCodeEditing,
    handleEditorChange,
    focusedNode,
    setFocusedNode,
    codeContent,
    setCodeContent,
    selection,
    updateSelection,
  };
}
