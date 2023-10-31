import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { debounce } from "lodash";
import { editor, IPosition } from "monaco-editor";
import morphdom from "morphdom";
import * as parse5 from "parse5";
import { useDispatch, useSelector } from "react-redux";

import { styles } from "@_components/main/stageView/iFrame/styles";
import { DefaultTabSize, RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { TFileNodeData } from "@_node/file";
import { parseHtml, StageNodeIdAttr } from "@_node/html";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";

import { CodeSelection } from "../types";
import {
  codeViewTabSizeSelector,
  setCodeEditing,
  setCodeViewTabSize,
} from "@_redux/main/codeView";
import { setNodeTree } from "@_redux/main/nodeTree";
import {
  currentFileUidSelector,
  fileTreeSelector,
  setFileTree,
} from "@_redux/main/fileTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import { setUpdateOptions } from "@_redux/main/processor";

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
  const codeViewTabeSize = useSelector(codeViewTabSizeSelector);
  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);
  const {
    addRunningActions,
    setMonacoEditorRef,
    setIsContentProgrammaticallyChanged,
    monacoEditorRef,
    setFSPending,
  } = useContext(MainContext);

  const dispatch = useDispatch();

  const [focusedNode, setFocusedNode] = useState<TNode>();
  const wordWrap: editor.IEditorOptions["wordWrap"] = "off";

  const editorConfigs = {
    contextmenu: true,
    tabSize: codeViewTabeSize,
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

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    monacoRef.current = editor;
    setMonacoEditorRef(editor);

    dispatch(setUpdateOptions({ parse: true, from: "file" }));
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
      const { htmlDom, nodeTree } = parseHtml(value);

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
        morphdom(iframeHtml, updatedHtml, {
          onBeforeElUpdated: function (fromEl, toEl) {
            const fromElRnbwId = fromEl.getAttribute(StageNodeIdAttr);
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
          onBeforeNodeAdded: function (node) {
            debugger;
            // if (node.nodeValue?.replace(/\s/g, "") === "\n") return false
            return node;
          },
        });
        codeContentRef.current = value;
        dispatch(setNodeTree(nodeTree));

        dispatch(setCurrentFileContent(codeContentRef.current));
        setFSPending(false);

        const _file = structuredClone(fileTree[currentFileUid]) as TNode;
        addRunningActions(["processor-updateOpt"]);
        const fileData = _file.data as TFileNodeData;
        (fileTree[currentFileUid].data as TFileNodeData).content =
          codeContentRef.current;
        (fileTree[currentFileUid].data as TFileNodeData).contentInApp =
          codeContentRef.current;
        (fileTree[currentFileUid].data as TFileNodeData).changed =
          codeContentRef.current !== fileData.orgContent;
        dispatch(setFileTree(fileTree));
        dispatch(setCurrentFileContent(codeContentRef.current));
        codeChangeDecorationRef.current.clear();
        dispatch(setCodeEditing(false));
        setFSPending(false);
      } catch (e) {
        console.log(e);
      }
      const headNode = iframeDoc?.head;

      // add rnbw css
      const style = iframeDoc.createElement("style");
      style.textContent = styles;
      headNode.appendChild(style);

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
  };
}
