import { TNodeTreeData, TNodeUid } from "@_node/types";
import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import { TTreeViewState } from "../types";

const getNodeTree = (state: AppState): TNodeTreeData =>
  state.main.nodeTree.nodeTree;
export const nodeTreeSelector = createSelector(
  getNodeTree,
  (nodeTree) => nodeTree,
);

const getValidNodeTree = (state: AppState): TNodeTreeData =>
  state.main.nodeTree.validNodeTree;
export const validNodeTreeSelector = createSelector(
  getValidNodeTree,
  (validNodeTree) => validNodeTree,
);

const getNodeTreeViewstate = (state: AppState): TTreeViewState =>
  state.main.nodeTree.nodeTreeViewState;
export const nodeTreeViewStateSelector = createSelector(
  getNodeTreeViewstate,
  (nodeTreeViewState) => nodeTreeViewState,
);

const getHoveredNodeUid = (state: AppState): TNodeUid =>
  state.main.nodeTree.hoveredNodeUid;
export const hoveredNodeUidSelector = createSelector(
  getHoveredNodeUid,
  (hoveredNodeUid) => hoveredNodeUid,
);
