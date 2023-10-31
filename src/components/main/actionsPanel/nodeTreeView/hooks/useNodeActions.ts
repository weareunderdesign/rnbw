import { useCallback, useContext } from "react";

import { Range } from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";

import { useEditor } from "@_components/main/codeView/hooks";
import { getValidNodeUids } from "@_node/index";
import { TNodeUid } from "@_node/types";
import { osTypeSelector } from "@_redux/global";
import { MainContext } from "@_redux/main";
import { codeViewTabSizeSelector } from "@_redux/main/codeView";
import {
  nodeTreeSelector,
  nodeTreeViewStateSelector,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import {
  clipboardDataSelector,
  setUpdateOptions,
} from "@_redux/main/processor";

import { getCopiedContent, sortUidsByMaxEndIndex } from "../helpers";
import { getTree } from "../helpers/getTree";

export function useNodeActions() {
  const dispatch = useDispatch();

  const nodeTree = useSelector(nodeTreeSelector);
  const validNodeTree = useSelector(validNodeTreeSelector);
  const { focusedItem } = useSelector(nodeTreeViewStateSelector);
  const codeViewTabSize = useSelector(codeViewTabSizeSelector);
  const clipboardData = useSelector(clipboardDataSelector);

  const osType = useSelector(osTypeSelector);
  const {
    // references
    htmlReferenceData,
    // other
    monacoEditorRef,
    setIsContentProgrammaticallyChanged,
    addRunningActions,
    removeRunningActions,
  } = useContext(MainContext);

  const { handleEditorChange } = useEditor();

  const cb_addNode = useCallback(
    (nodeType: string) => {
      const monacoEditor = monacoEditorRef.current;
      if (!monacoEditor) return;
      if (!nodeTree[focusedItem]) return;

      //TODO: add node
      // let { newNode, _tree, tmpMaxUid, contentNode, newNodeFlag } =
      //   creatingNode(
      //     nodeMaxUid,
      //     nodeTree,
      //     focusedItem,
      //     nodeType,
      //     htmlReferenceData,
      //   );
      // let tempTree;

      // // call api
      // const tree = getTree(nodeTree);

      // if (_tree) {
      //   addNodeToTree(_tree, tree, nodeTree, focusedItem, newNode, tmpMaxUid);
      // } else {
      //   const res = addNode(
      //     tree,
      //     focusedItem,
      //     newNode,
      //     contentNode,
      //     "html",
      //     String(contentNode ? nodeMaxUid + 2 : nodeMaxUid + 1) as TNodeUid,
      //     osType,
      //     codeViewTabSize,
      //   );
      //   tempTree = res.tree;
      //   tmpMaxUid = res.nodeMaxUid as TNodeUid;
      // }
      // // processor
      // addRunningActions(["processor-updateOpt"]);
      // dispatch(setUpdateOptions({ parse: false, from: "node" }));
      // setNodeTree(tree);

      // // view state
      // addRunningActions(["stageView-viewState"]);
      // dispatch(setUpdateOptions({ parse: true, from: "code" }));

      // // side effect
      // setNodeMaxUid(Number(tmpMaxUid) + 1);
      // dispatch(
      //   setNodeEvent({
      //     type: "add-node",
      //     param: [
      //       focusedItem,
      //       newNodeFlag ? tree[Number(tmpMaxUid) + 1] : newNode,
      //       tree[newNode.uid],
      //     ],
      //   }),
      // );

      // removeRunningActions(["nodeTreeView-add"]);
      // console.log("hms added");
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      focusedItem,
      osType,
      codeViewTabSize,
      htmlReferenceData,
    ],
  );

  const cb_removeNode = useCallback(
    (uids: TNodeUid[]) => {
      setIsContentProgrammaticallyChanged(true);
      const model = monacoEditorRef.current?.getModel();
      if (!model) return;
      let focusLineNumber = 0;
      let parentUids = [] as TNodeUid[];
      uids.forEach((uid) => {
        let node = validNodeTree[uid];

        if (node) {
          let parentUid = node.parentUid;
          if (parentUid) {
            parentUids.push(parentUid);
          }
          const {
            endCol: endColumn,
            endLine: endLineNumber,
            startCol: startColumn,
            startLine: startLineNumber,
          } = node.data.sourceCodeLocation;

          const range = new Range(
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          );
          let edit = {
            range: range,
            text: "",
          };
          model.applyEdits([edit]);
          focusLineNumber = startLineNumber;
        }
      });

      const content = model.getValue();
      handleEditorChange(content, {
        matchIds: uids,
      });
      monacoEditorRef.current?.revealLineInCenter(focusLineNumber);
    },
    [addRunningActions, removeRunningActions, nodeTree],
  );

  const cb_duplicateNode = (uids: TNodeUid[]) => {
    setIsContentProgrammaticallyChanged(true);

    const iframe: any = document.getElementById("iframeId");
    const model = monacoEditorRef.current?.getModel();
    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    let content = model.getValue();

    const sortedUids = sortUidsByMaxEndIndex(uids, validNodeTree);

    sortedUids.forEach(async (uid) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);

      if (!cleanedUpCode) return;

      const selectedNode = validNodeTree[uid];
      if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
        console.error("Parent node or source code location is undefined");
        return;
      }
      const { endLine, endCol } = selectedNode.data.sourceCodeLocation;

      const position = { lineNumber: endLine, column: endCol + 1 };

      const range = new Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      );
      const editOperation = { range, text: "\n" + cleanedUpCode };

      model.pushEditOperations([], [editOperation], () => null);
      monacoEditorRef.current?.setPosition({
        lineNumber: position.lineNumber + 1,
        column: 1,
      });

      content = model.getValue();
    });

    handleEditorChange(content);
  };

  const cb_copyNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    let copiedCode = "";

    uids.forEach((uid) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);

      if (!cleanedUpCode) return;

      copiedCode += cleanedUpCode + "\n";
    });
    //copy the cleaned up code to clipboard
    window.navigator.clipboard.writeText(copiedCode);
  };

  const cb_moveNode = useCallback(
    (_uids: TNodeUid[], targetUid: TNodeUid) => {
      // validate
      const uids = getValidNodeUids(
        nodeTree,
        _uids,
        targetUid,
        "html",
        htmlReferenceData,
      );
      if (uids.length === 0) return;

      addRunningActions(["nodeTreeView-move"]);

      // call api
      const tree = getTree(nodeTree);

      // processor
      addRunningActions(["processor-updateOpt"]);
      dispatch(setUpdateOptions({ parse: false, from: "node" }));

      // view state
      addRunningActions(["stageView-viewState"]);
      dispatch(setUpdateOptions({ parse: true, from: "code" }));
      // side effect

      removeRunningActions(["nodeTreeView-move"]);

      console.log("hms added");
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      htmlReferenceData,
      osType,
      codeViewTabSize,
    ],
  );

  return {
    cb_addNode,
    cb_removeNode,
    cb_duplicateNode,
    cb_copyNode,

    cb_moveNode,
  };
}
