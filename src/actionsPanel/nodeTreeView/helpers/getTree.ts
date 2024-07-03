import { TNodeTreeData } from "@_node/types";

export const getTree = (nodeTree: TNodeTreeData): TNodeTreeData => {
  return structuredClone(nodeTree);
};
