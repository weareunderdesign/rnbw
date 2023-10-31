import undoable from "redux-undo";

import { TNodeUid } from "@_node/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  NodeTree_Event_ClearActionType,
  NodeTree_Event_RedoActionType,
  NodeTree_Event_StoreLimit,
  NodeTree_Event_UndoActionType,
} from "./constants";
import { TNodeTreeEventReducerState } from "./types";

const nodeTreeEventReducerInitialState: TNodeTreeEventReducerState = {
  currentFileContent: "",
  selectedNodeUids: [],
};
const nodeTreeEventSlice = createSlice({
  name: "nodeTreeEvent",
  initialState: nodeTreeEventReducerInitialState,
  reducers: {
    setCurrentFileContent(state, action: PayloadAction<string>) {
      const currentFileContent = action.payload;
      state.currentFileContent = currentFileContent;
    },
    setSelectedItems(state, action: PayloadAction<TNodeUid[]>) {
      const selectedNodeUids = action.payload;
      state.selectedNodeUids = [...selectedNodeUids];
    },
  },
});
export const { setCurrentFileContent, setSelectedItems } =
  nodeTreeEventSlice.actions;
export const NodeTreeEventReducer = undoable(nodeTreeEventSlice.reducer, {
  limit: NodeTree_Event_StoreLimit,
  undoType: NodeTree_Event_UndoActionType,
  redoType: NodeTree_Event_RedoActionType,
  clearHistoryType: NodeTree_Event_ClearActionType,
});
