import { useCallback, useContext } from "react";

import { Range } from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";

import { useEditor } from "@_components/main/codeView/hooks";
import {
  addNode,
  copyNodeExternal,
  duplicateNode,
  getValidNodeUids,
  moveNode,
} from "@_node/index";
import { TNode, TNodeUid } from "@_node/types";
import {
  fnSelector,
  increaseActionGroupIndex,
  MainContext,
} from "@_redux/main";

import { addNodeToTree } from "../helpers/addNodeToTree";
import { creatingNode } from "../helpers/creatingNode";
import { getTree } from "../helpers/getTree";
import { useEditor } from "@_components/main/codeView/hooks";
import { NodeInAppAttribName } from "@_constants/main";

export function useNodeActions() {
  const dispatch = useDispatch();
  const { focusedItem } = useSelector(fnSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // node actions
    clipboardData,
    setEvent,
    // node tree view
    nodeTree,
    setNodeTree,
    nodeMaxUid,
    setNodeMaxUid,
    // code view
    tabSize,
    // processor
    setUpdateOpt,
    // references
    htmlReferenceData,
    // other
    osType,
    theme: _theme,
    monacoEditorRef,
    validNodeTree,
  } = useContext(MainContext);

  const { handleEditorChange } = useEditor();

  const cb_addNode = useCallback(
    (nodeType: string) => {
      const monacoEditor = monacoEditorRef.current;
      if (!monacoEditor) return;
      if (!nodeTree[focusedItem]) return;
      addRunningActions(["nodeTreeView-add"]);

      let { newNode, _tree, tmpMaxUid, contentNode, newNodeFlag } =
        creatingNode(
          nodeMaxUid,
          nodeTree,
          focusedItem,
          nodeType,
          htmlReferenceData,
        );
      let tempTree;

      // call api
      const tree = getTree(nodeTree);

      if (_tree) {
        addNodeToTree(_tree, tree, nodeTree, focusedItem, newNode, tmpMaxUid);
      } else {
        const res = addNode(
          tree,
          focusedItem,
          newNode,
          contentNode,
          "html",
          String(contentNode ? nodeMaxUid + 2 : nodeMaxUid + 1) as TNodeUid,
          osType,
          tabSize,
        );
        tempTree = res.tree;
        tmpMaxUid = res.nodeMaxUid as TNodeUid;
      }
      // processor
      addRunningActions(["processor-updateOpt"]);
      setUpdateOpt({ parse: false, from: "node" });
      setNodeTree(tree);

      // view state
      addRunningActions(["stageView-viewState"]);
      setUpdateOpt({ parse: true, from: "code" });

      // side effect
      setNodeMaxUid(Number(tmpMaxUid) + 1);
      setEvent({
        type: "add-node",
        param: [
          focusedItem,
          newNodeFlag ? tree[Number(tmpMaxUid) + 1] : newNode,
          tree[newNode.uid],
        ],
      });

      removeRunningActions(["nodeTreeView-add"]);
      console.log("hms added");

      dispatch(increaseActionGroupIndex());
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      focusedItem,
      nodeMaxUid,
      osType,
      tabSize,
      htmlReferenceData,
    ],
  );

  const cb_removeNode = useCallback(
    (uids: TNodeUid[]) => {
      // const allow = isRemovingAllowed(nodeTree, uids);//Commenting this for now as it doesn't makes sense because the user can always delete this from codeview
      const model = monacoEditorRef.current?.getModel();
      if (!model) return;
      let focusLineNumber = 0;

      uids.forEach((uid) => {
        let node = validNodeTree[uid];
        if (node) {
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
      handleEditorChange(content);
      monacoEditorRef.current?.revealLineInCenter(focusLineNumber);
    },
    [addRunningActions, removeRunningActions, nodeTree],
  );

  const cb_duplicateNode = useCallback(
    (uids: TNodeUid[]) => {
      addRunningActions(["nodeTreeView-duplicate"]);

      // call api
      const tree = getTree(nodeTree);
      const res = duplicateNode(
        tree,
        uids,
        "html",
        String(nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );

      // processor
      addRunningActions(["processor-updateOpt"]);
      setUpdateOpt({ parse: false, from: "node" });
      setNodeTree(res.tree);

      // view state
      addRunningActions(["stageView-viewState"]);
      setUpdateOpt({ parse: true, from: "code" });
      // side effect
      setNodeMaxUid(Number(res.nodeMaxUid));
      setEvent({ type: "duplicate-node", param: [uids, res.addedUidMap] });

      removeRunningActions(["nodeTreeView-duplicate"]);
      console.log("hms added");
      dispatch(increaseActionGroupIndex());
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      nodeMaxUid,
      osType,
      tabSize,
    ],
  );

  const cb_copyNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    let copiedCode = "";

    uids.forEach((uid) => {
      const ele = iframe?.contentWindow?.document?.querySelector(
        `[${NodeInAppAttribName}="${uid}"]`,
      );

      //create a copy of ele
      const eleCopy = ele?.cloneNode(true) as HTMLElement;
      const innerElements = eleCopy.querySelectorAll(
        `[${NodeInAppAttribName}]`,
      );

      innerElements.forEach((element) => {
        if (element.hasAttribute(NodeInAppAttribName)) {
          element.removeAttribute(NodeInAppAttribName);
        }
      });

      eleCopy?.removeAttribute("contenteditable");
      eleCopy?.removeAttribute("rnbwdev-rnbw-element-hover");
      eleCopy?.removeAttribute("rnbwdev-rnbw-element-select");
      eleCopy?.removeAttribute(NodeInAppAttribName);
      const cleanedUpCode = eleCopy?.outerHTML;

      //delete the copy
      eleCopy?.remove();
      if (!cleanedUpCode) return;

      copiedCode += cleanedUpCode + "\n";
    });
    //copy the cleaned up code to clipboard
    window.navigator.clipboard.writeText(copiedCode);
  };

  const cb_copyNodeExternal = useCallback(
    (
      nodes: TNode[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
    ) => {
      addRunningActions(["nodeTreeView-copy"]);

      // call api
      const tree = getTree(nodeTree);
      const res = copyNodeExternal(
        tree,
        targetUid,
        isBetween,
        position,
        nodes,
        "html",
        String(nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
        clipboardData.prevNodeTree,
      );

      // processor
      addRunningActions(["processor-updateOpt"]);
      setUpdateOpt({ parse: false, from: "node" });
      setNodeTree(res.tree);
      // view state
      addRunningActions(["stageView-viewState"]);
      setUpdateOpt({ parse: true, from: "code" });
      // side effect
      setNodeMaxUid(Number(res.nodeMaxUid));
      setEvent({
        type: "copy-node-external",
        param: [nodes, targetUid, isBetween, position, res.addedUidMap],
      });
      removeRunningActions(["nodeTreeView-copy"]);

      console.log("hms added");
      dispatch(increaseActionGroupIndex());
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      nodeMaxUid,
      osType,
      tabSize,
      clipboardData,
    ],
  );

  const cb_moveNode = useCallback(
    (
      _uids: TNodeUid[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
    ) => {
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
      const res = moveNode(
        tree,
        targetUid,
        isBetween,
        position,
        uids,
        "html",
        String(nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );

      // processor
      addRunningActions(["processor-updateOpt"]);
      setUpdateOpt({ parse: false, from: "node" });
      setNodeTree(res.tree);

      // view state
      addRunningActions(["stageView-viewState"]);
      setUpdateOpt({ parse: true, from: "code" });
      // side effect
      setNodeMaxUid(Number(res.nodeMaxUid));
      setEvent({
        type: "move-node",
        param: [uids, targetUid, isBetween, res.position],
      });

      removeRunningActions(["nodeTreeView-move"]);

      console.log("hms added");
      dispatch(increaseActionGroupIndex());
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      htmlReferenceData,
      nodeMaxUid,
      osType,
      tabSize,
    ],
  );

  return {
    cb_addNode,
    cb_removeNode,
    cb_duplicateNode,
    cb_copyNode,
    cb_copyNodeExternal,
    cb_moveNode,
  };
}
