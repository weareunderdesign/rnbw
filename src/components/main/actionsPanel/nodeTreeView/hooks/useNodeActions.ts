import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TNode, TNodeUid } from "@_node/types";
import {
  addNode,
  copyNode,
  copyNodeExternal,
  duplicateNode,
  getValidNodeUids,
  moveNode,
  removeNode,
} from "@_node/index";

import {
  fnSelector,
  focusFNNode,
  increaseActionGroupIndex,
  MainContext,
  selectFNNode,
} from "@_redux/main";

import { creatingNode } from "../helpers/creatingNode";
import { addNodeToTree } from "../helpers/addNodeToTree";
import { isRemovingAllowed } from "../helpers/isRemovingAllowed";
import { getTree } from "../helpers/getTree";

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
  } = useContext(MainContext);

  const cb_addNode = useCallback(
    (nodeType: string) => {
      if (!nodeTree[focusedItem]) return;
      addRunningActions(["nodeTreeView-add"]);

      let { newNode, _tree, tmpMaxUid, contentNode, newNodeFlag } =
        creatingNode(
          nodeMaxUid,
          nodeTree,
          focusedItem,
          nodeType,
          htmlReferenceData,
          osType,
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
      const allow = isRemovingAllowed(nodeTree, uids);

      if (allow) {
        addRunningActions(["nodeTreeView-remove"]);

        // call api
        const tree = getTree(nodeTree);
        const res = removeNode(tree, uids, "html");

        // processor
        addRunningActions(["processor-updateOpt"]);
        setUpdateOpt({ parse: false, from: "node" });
        setNodeTree(res.tree);

        // view state
        addRunningActions(["stageView-viewState"]);
        setUpdateOpt({ parse: true, from: "code" });
        setTimeout(() => {
          if (res.lastNodeUid && res.lastNodeUid !== "") {
            dispatch(focusFNNode(res.lastNodeUid));
            dispatch(selectFNNode([res.lastNodeUid]));
          }
        }, 100);
        // side effect
        setEvent({ type: "remove-node", param: [uids, res.deletedUids] });

        removeRunningActions(["nodeTreeView-remove"]);
        console.log("hms added");
        dispatch(increaseActionGroupIndex());
      } else {
        console.log(
          "Can't remove this element because it's an unique element of this page",
        );
      }
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

  const cb_copyNode = useCallback(
    (
      uids: TNodeUid[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
    ) => {
      addRunningActions(["nodeTreeView-copy"]);

      // call api
      const tree = getTree(nodeTree);
      const res = copyNode(
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

      setUpdateOpt({ parse: true, from: "code" });
      // view state
      addRunningActions(["stageView-viewState"]);
      // side effect
      setNodeMaxUid(Number(res.nodeMaxUid));

      setEvent({
        type: "copy-node",
        param: [uids, targetUid, isBetween, position, res.addedUidMap],
      });

      removeRunningActions(["nodeTreeView-copy"]);
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
