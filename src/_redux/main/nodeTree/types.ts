import { TNodeTreeData, TNodeUid } from "@_node/types";

import { TTreeViewState } from "../types";

export type TNodeTreeReducerState = {
  nodeTree: TNodeTreeData;
  validNodeTree: TNodeTreeData;

  nodeTreeViewState: TTreeViewState;
  hoveredNodeUid: TNodeUid;
};
