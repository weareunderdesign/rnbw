import { TNodeTreeData } from "@_api/types";

export const getTree = (nodeTree: TNodeTreeData): TNodeTreeData => {
  return structuredClone(nodeTree);
};
