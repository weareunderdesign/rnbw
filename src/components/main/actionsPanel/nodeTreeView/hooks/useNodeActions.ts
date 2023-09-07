import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import {
  addNode,
  copyNode,
  copyNodeExternal,
  duplicateNode,
  getValidNodeUids,
  moveNode,
  removeNode,
  THtmlNodeData,
} from "@_node/index";

import {
  fnSelector,
  focusFNNode,
  increaseActionGroupIndex,
  MainContext,
  selectFNNode,
} from "@_redux/main";

import { NodeInAppAttribName } from "@_constants/main";
import { creatingNode } from "../helpers/creatingNode";

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
      const tree = JSON.parse(JSON.stringify(nodeTree));

      if (_tree) {
        let _parent = tree[nodeTree[focusedItem].parentUid as TNodeUid];
        for (let x in _tree) {
          if (x === "text") continue;
          if (x === "ROOT") {
            _tree[x].uid = String(Number(tmpMaxUid) + 1);
            _tree[x].parentUid =
              focusedItem !== "ROOT" && _parent !== undefined
                ? nodeTree[focusedItem].parentUid
                : "ROOT";
            _tree[x].name = newNode.name;
            _tree[x].data.type = "tag";
            _tree[x].data.name = newNode.name;
            _tree[x].data.valid = true;
            (_tree[x].data as THtmlNodeData).attribs = {
              [NodeInAppAttribName]: String(Number(tmpMaxUid) + 1) as TNodeUid,
            };
            newNode.uid = String(Number(tmpMaxUid) + 1);
            tree[String(Number(tmpMaxUid) + 1)] = _tree[x];
            if (focusedItem !== "ROOT" && _parent !== undefined) {
              _parent.children.push(String(Number(tmpMaxUid) + 1));
            } else {
              tree["ROOT"].children.push(String(Number(tmpMaxUid) + 1));
            }
          } else {
            if (_tree[x].parentUid === "ROOT") {
              _tree[x].parentUid = String(Number(tmpMaxUid) + 1);
            }
            tree[x] = _tree[x];
          }
        }
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
      console.log("### hms added");

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
      let allow = true;
      let htmlTagCount = 0,
        bodyTagCount = 0,
        headTagCount = 0;
      for (let x in nodeTree) {
        (nodeTree[x]?.data as THtmlNodeData).name === "html" &&
          (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
          htmlTagCount++;
        (nodeTree[x]?.data as THtmlNodeData).name === "body" &&
          (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
          bodyTagCount++;
        (nodeTree[x]?.data as THtmlNodeData).name === "head" &&
          (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
          headTagCount++;
      }
      uids.map((_uid) => {
        const node = nodeTree[_uid];
        const nodeData = nodeTree[_uid].data as THtmlNodeData;
        if (!node || !nodeData) {
          allow = false;
          return;
        }
        if (
          (nodeData.name === "html" &&
            nodeData.type === "tag" &&
            htmlTagCount === 1) ||
          (nodeData.name === "head" &&
            nodeData.type === "tag" &&
            headTagCount === 1) ||
          (nodeData.name === "body" &&
            nodeData.type === "tag" &&
            bodyTagCount === 1)
        ) {
          allow = false;
          return;
        }
      });
      if (allow) {
        addRunningActions(["nodeTreeView-remove"]);

        // call api
        const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData;
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
      const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData;
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
      const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData;
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
      const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData;
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
      const tree = JSON.parse(JSON.stringify(nodeTree)) as TNodeTreeData;
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
