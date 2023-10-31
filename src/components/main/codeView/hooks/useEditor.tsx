import * as parse5 from "parse5";

import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { IPosition, editor } from "monaco-editor";
import {
  MainContext,
  focusFNNode,
  navigatorSelector,
  selectFNNode,
  setCurrentFileContent,
} from "@_redux/main";
import morphdom from "morphdom";
import {
  DefaultTabSize,
  NodeInAppAttribName,
  RootNodeUid,
} from "@_constants/main";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { parseHtml } from "@_node/html";
import { CodeSelection } from "../types";
import { TFileNodeData } from "@_node/file";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { styles } from "@_components/main/stageView/iFrame/styles";
import { debounce, set } from "lodash";

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
    ffTree,
    addRunningActions,
    setUpdateOpt,
    setFSPending,
    setFFTree,
    setMonacoEditorRef,
    setNodeTree,
    setIsContentProgrammaticallyChanged,
    monacoEditorRef,
    parseFileFlag,
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

    setUpdateOpt({ parse: true, from: "file" });
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
        const sourceCodeLocation = node.sourceCodeLocation;

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
      const { htmlDom, tree } = parseHtml(value, false, "");

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
            const fromElRnbwId = fromEl.getAttribute(NodeInAppAttribName);
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
          onBeforeNodeAdded: function (node: Node) {
            if (node.nodeType === 1) {
              //@ts-ignore
              const uid = node.getAttribute(NodeInAppAttribName);
              if (!!uid) {
                nodeUidToFocus = uid;
              }
            }
            return node;
          },
        });

        codeContentRef.current = value;
        setNodeTree(tree);

        dispatch(setCurrentFileContent(codeContentRef.current));
        setFSPending(false);

        const _file = structuredClone(ffTree[file.uid]) as TNode;
        addRunningActions(["processor-updateOpt"]);
        const fileData = _file.data as TFileNodeData;
        (ffTree[file.uid].data as TFileNodeData).content =
          codeContentRef.current;
        (ffTree[file.uid].data as TFileNodeData).contentInApp =
          codeContentRef.current;
        (ffTree[file.uid].data as TFileNodeData).changed =
          codeContentRef.current !== fileData.orgContent;
        setFFTree(ffTree);
        dispatch(setCurrentFileContent(codeContentRef.current));
        codeChangeDecorationRef.current.clear();
        setCodeEditing(false);
        setFSPending(false);

        //finding and selecting focused node
        const focusedNode = tree[nodeUidToFocus];
        dispatch(focusFNNode(focusedNode.uid));
        dispatch(selectFNNode([focusedNode.uid]));
        //current code range in monaco editor
        const {
          endCol: endColumn,
          endLine: endLineNumber,
          startCol: startColumn,
          startLine: startLineNumber,
        } = focusedNode.sourceCodeLocation;
        monacoEditor.setSelection({
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        });
      } catch (e) {
        console.log(e);
      }
      const headNode = iframeDoc?.head;

      // add rnbw css
      const style = iframeDoc.createElement("style");
      style.textContent = styles;
      headNode.appendChild(style);

      setCodeEditing(false);
    }, 1000),
    [ffTree, file, setFFTree, addRunningActions, setFSPending, dispatch],
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
    focusedNode,
    setFocusedNode,
    codeContent,
    setCodeContent,
    selection,
    updateSelection,
  };
}
