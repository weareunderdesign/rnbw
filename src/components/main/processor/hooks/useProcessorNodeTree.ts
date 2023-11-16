import { useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { TNodeTreeData } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setValidNodeTree } from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

export const useProcessorNodeTree = () => {
  const dispatch = useDispatch();
  const { nodeTree } = useAppState();
  const { addRunningActions, removeRunningActions } = useContext(MainContext);

  useEffect(() => {
    if (!nodeTree[RootNodeUid]) return;

    addRunningActions(["processor-nodeTree"]);

    const _nodeTree: TNodeTreeData = structuredClone(nodeTree);
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
    dispatch(setValidNodeTree(_validNodeTree));

    removeRunningActions(["processor-nodeTree"]);
  }, [nodeTree]);
};
