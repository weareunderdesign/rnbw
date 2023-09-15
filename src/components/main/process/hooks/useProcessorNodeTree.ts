import { useContext, useEffect } from "react";
import { RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { TNodeTreeData } from "@_node/types";
import { MainContext } from "@_redux/main";

export const useProcessorNodeTree = () => {
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // node tree view
    nodeTree,
    setValidNodeTree,
  } = useContext(MainContext);

  useEffect(() => {
    if (!nodeTree[RootNodeUid]) return;

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
    setValidNodeTree(_validNodeTree);

    removeRunningActions(["processor-nodeTree"]);
  }, [nodeTree]);
};
