import { TFileNode, TFileNodeTreeData } from "@_node/index";
import { TNodeUid } from "@_node/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TUpdateTreeViewStatePayload } from "../types";
import { TFileAction } from "./event";
import { TFileTreeReducerState, TProject, TWorkspace } from "./types";

const fileTreeReducerInitialState: TFileTreeReducerState = {
  workspace: { name: "local", projects: [] },
  project: { context: "idb", name: "welcome", handler: null, favicon: null },
  fileTree: {},
  initialFileUidToOpen: "",
  currentFileUid: "",

  fileTreeViewState: {
    focusedItem: "",
    expandedItems: [],
    expandedItemsObj: {},
    selectedItems: [],
    selectedItemsObj: {},
  },
  hoveredFileUid: "",

  doingFileAction: false,
  lastFileAction: { type: null },
};

const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: fileTreeReducerInitialState,
  reducers: {
    setWorkspace(state, action: PayloadAction<TWorkspace>) {
      const workspace = action.payload;
      state.workspace = workspace;
    },
    setProject(state, action: PayloadAction<TProject>) {
      const project = action.payload;
      state.project = project;
    },
    setFileTree(state, action: PayloadAction<TFileNodeTreeData>) {
      const fileTree = action.payload;
      state.fileTree = fileTree;
    },
    setFileTreeNode(state, action: PayloadAction<TFileNode>) {
      const fileNode = action.payload;
      state.fileTree[fileNode.uid] = fileNode;
    },
    setInitialFileUidToOpen(state, action: PayloadAction<TNodeUid>) {
      const initialFileUidToOpen = action.payload;
      state.initialFileUidToOpen = initialFileUidToOpen;
    },
    setCurrentFileUid(state, action: PayloadAction<TNodeUid>) {
      const currentFileUid = action.payload;
      state.currentFileUid = currentFileUid;
    },

    focusFileTreeNode(state, action: PayloadAction<TNodeUid>) {
      const uid = action.payload;
      state.fileTreeViewState.focusedItem = uid;
    },
    expandFileTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload;
      for (const uid of uids) {
        state.fileTreeViewState.expandedItemsObj[uid] = true;
      }
      state.fileTreeViewState.expandedItems = Object.keys(
        state.fileTreeViewState.expandedItemsObj,
      );
    },
    collapseFileTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload;
      for (const uid of uids) {
        delete state.fileTreeViewState.expandedItemsObj[uid];
      }
      state.fileTreeViewState.expandedItems = Object.keys(
        state.fileTreeViewState.expandedItemsObj,
      );
    },
    selectFileTreeNodes(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload;
      state.fileTreeViewState.selectedItems = uids;
      state.fileTreeViewState.selectedItemsObj = {};
      for (const uid of uids) {
        state.fileTreeViewState.selectedItemsObj[uid] = true;
      }
    },
    updateFileTreeViewState(
      state,
      action: PayloadAction<TUpdateTreeViewStatePayload>,
    ) {
      const { deletedUids = [], convertedUids = [] } = action.payload;
      for (const uid of deletedUids) {
        if (state.fileTreeViewState.focusedItem === uid) {
          state.fileTreeViewState.focusedItem = "";
        }
        delete state.fileTreeViewState.expandedItemsObj[uid];
        delete state.fileTreeViewState.selectedItemsObj[uid];
      }
      for (const [prevUid, curUid] of convertedUids) {
        if (state.fileTreeViewState.expandedItemsObj[prevUid]) {
          delete state.fileTreeViewState.expandedItemsObj[prevUid];
          state.fileTreeViewState.expandedItemsObj[curUid] = true;
        }
        if (state.fileTreeViewState.selectedItemsObj[prevUid]) {
          delete state.fileTreeViewState.selectedItemsObj[prevUid];
          state.fileTreeViewState.selectedItemsObj[curUid] = true;
        }
      }
      state.fileTreeViewState.expandedItems = Object.keys(
        state.fileTreeViewState.expandedItemsObj,
      );
      state.fileTreeViewState.selectedItems = Object.keys(
        state.fileTreeViewState.selectedItemsObj,
      );
    },
    setHoveredFileUid(state, action: PayloadAction<TNodeUid>) {
      const hoveredFileUid = action.payload;
      state.hoveredFileUid = hoveredFileUid;
    },
    clearFileTreeViewState(state) {
      state.fileTreeViewState = fileTreeReducerInitialState.fileTreeViewState;
    },

    setDoingFileAction(state, action: PayloadAction<boolean>) {
      const doingFileaction = action.payload;
      state.doingFileAction = doingFileaction;
    },
    setLastFileAction(state, action: PayloadAction<TFileAction>) {
      const lastFileAction = action.payload;
      state.lastFileAction = lastFileAction;
    },
  },
});
export const {
  setWorkspace,
  setProject,
  setFileTree,
  setFileTreeNode,
  setInitialFileUidToOpen,
  setCurrentFileUid,

  focusFileTreeNode,
  expandFileTreeNodes,
  collapseFileTreeNodes,
  selectFileTreeNodes,
  updateFileTreeViewState,
  setHoveredFileUid,
  clearFileTreeViewState,

  setDoingFileAction,
  setLastFileAction,
} = fileTreeSlice.actions;
export const FileTreeReducer = fileTreeSlice.reducer;
