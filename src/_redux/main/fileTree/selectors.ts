import { TNodeTreeData, TNodeUid } from "@_node/types";
import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import { TTreeViewState } from "../types";
import { TFileAction } from "./event";
import { TProject, TWorkspace } from "./types";

const getWorkspace = (state: AppState): TWorkspace =>
  state.main.fileTree.workspace;
export const workspaceSelector = createSelector(
  getWorkspace,
  (workspace) => workspace,
);

const getProject = (state: AppState): TProject => state.main.fileTree.project;
export const projectSelector = createSelector(getProject, (project) => project);

const getFileTree = (state: AppState): TNodeTreeData =>
  state.main.fileTree.fileTree;
export const fileTreeSelector = createSelector(
  getFileTree,
  (fileTree) => fileTree,
);

const getInitialFileUidToOpen = (state: AppState): TNodeUid =>
  state.main.fileTree.initialFileUidToOpen;
export const initialFileUidToOpenSelector = createSelector(
  getInitialFileUidToOpen,
  (initialFileUidToOpen) => initialFileUidToOpen,
);

const getCurrentFileUid = (state: AppState): TNodeUid =>
  state.main.fileTree.currentFileUid;
export const currentFileUidSelector = createSelector(
  getCurrentFileUid,
  (currentFileUid) => currentFileUid,
);

const getFileTreeViewState = (state: AppState): TTreeViewState =>
  state.main.fileTree.fileTreeViewState;
export const fileTreeViewStateSelector = createSelector(
  getFileTreeViewState,
  (fileTreeViewState) => fileTreeViewState,
);

const getHoveredFileUid = (state: AppState): TNodeUid =>
  state.main.fileTree.hoveredFileUid;
export const hoveredFileUidSelector = createSelector(
  getHoveredFileUid,
  (hoveredFileUid) => hoveredFileUid,
);

const getDoingFileAction = (state: AppState): boolean =>
  state.main.fileTree.doingFileAction;
export const doingFileActionSelector = createSelector(
  getDoingFileAction,
  (doingFileAction) => doingFileAction,
);

const getLastFileAction = (state: AppState): TFileAction =>
  state.main.fileTree.lastFileAction;
export const lastFileActionSelector = createSelector(
  getLastFileAction,
  (lastFileAction) => lastFileAction,
);
