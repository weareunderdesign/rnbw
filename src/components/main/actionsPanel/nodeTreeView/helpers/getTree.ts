import _ from "lodash";
import { TNodeTreeData } from "@_node/types";

export const getTree = (nodeTree: TNodeTreeData): TNodeTreeData => {
  return _.cloneDeep(nodeTree);
};
