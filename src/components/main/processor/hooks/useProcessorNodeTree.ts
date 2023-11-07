import { useContext, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { TNodeTreeData } from "@_node/types";
import { MainContext } from "@_redux/main";
import { nodeTreeSelector, setValidNodeTree } from "@_redux/main/nodeTree";

export const useProcessorNodeTree = () => {
  const dispatch = useDispatch();

  const nodeTree = useSelector(nodeTreeSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
  } = useContext(MainContext);

  useEffect(() => {
    if (!nodeTree || !nodeTree[RootNodeUid]) return;

    const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
    const _validNodeTree: TNodeTreeData = {};

    // build valid node tree
    const uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree);
    uids.reverse();
    uids.map((uid) => {
      const node = _nodeTree[uid];
      if (!node.data.valid) return;

      node.children = node.children.filter(
        (c_uid) => _nodeTree[c_uid].data.valid,
      );
      node.isEntity = node.children.length === 0;
      _validNodeTree[uid] = node;
    });

    addRunningActions(["processor-validNodeTree"]);
    dispatch(setValidNodeTree(_validNodeTree));

    removeRunningActions(["processor-nodeTree"]);
  }, [nodeTree]);
};
