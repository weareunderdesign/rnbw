import undoable from "redux-undo";

import { TFileAction } from "@_node/file";
import { TNodeUid } from "@_node/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  FileTree_EventHistory_ClearActionType,
  FileTree_EventHistory_RedoActionType,
  FileTree_EventHistory_StoreLimit,
  FileTree_EventHistory_UndoActionType,
  NodeTree_EventHistory_ClearActionType,
  NodeTree_EventHistory_RedoActionType,
  NodeTree_EventHistory_StoreLimit,
  NodeTree_EventHistory_UndoActionType,
} from "./constants";
import { TFileTreeReducerState, TNodeTreeReducerState } from "./types";

const fileTreeReducerInitialState: TFileTreeReducerState = {
  fileAction: {
    type: null,
  },
};
const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: fileTreeReducerInitialState,
  reducers: {
    setFileAction(state, action: PayloadAction<TFileAction>) {
      state.fileAction = action.payload;
    },
    clearFileTreeReducerState(state) {
      state.fileAction = fileTreeReducerInitialState.fileAction;
    },
  },
});
export const { setFileAction, clearFileTreeReducerState } =
  fileTreeSlice.actions;
export const FileTreeReducer = undoable(fileTreeSlice.reducer, {
  limit: FileTree_EventHistory_StoreLimit,
  undoType: FileTree_EventHistory_UndoActionType,
  redoType: FileTree_EventHistory_RedoActionType,
  clearHistoryType: FileTree_EventHistory_ClearActionType,
});

const nodeTreeReducerInitialState: TNodeTreeReducerState = {
  fileContent: "",
  selectedItems: [],
};
const nodeTreeSlice = createSlice({
  name: "nodeTree",
  initialState: nodeTreeReducerInitialState,
  reducers: {
    setFileContent(state, action: PayloadAction<string>) {
      state.fileContent = action.payload;
    },
    setSelectedItems(state, actions: PayloadAction<TNodeUid[]>) {
      state.selectedItems = [...actions.payload];
    },
    clearNodeTreeReducerState(state) {
      state.fileContent = nodeTreeReducerInitialState.fileContent;
      state.selectedItems = nodeTreeReducerInitialState.selectedItems;
    },
  },
});
export const { setFileContent, setSelectedItems, clearNodeTreeReducerState } =
  nodeTreeSlice.actions;
export const NodeTreeReducer = undoable(nodeTreeSlice.reducer, {
  limit: NodeTree_EventHistory_StoreLimit,
  undoType: NodeTree_EventHistory_UndoActionType,
  redoType: NodeTree_EventHistory_RedoActionType,
  clearHistoryType: NodeTree_EventHistory_ClearActionType,
});
