import undoable from "redux-undo";

import { TNodeUid } from "@_node/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  NodeTree_Event_ClearActionType,
  NodeTree_Event_RedoActionType,
  NodeTree_Event_StoreLimit,
  NodeTree_Event_UndoActionType,
} from "./constants";
import { TNodeEventReducerState } from "./types";

const nodeEventReducerInitialState: TNodeEventReducerState = {
  currentFileContent: "",
  selectedNodeUids: [],
};
const nodeEventSlice = createSlice({
  name: "nodeEvent",
  initialState: nodeEventReducerInitialState,
  reducers: {
    setCurrentFileContent(state, action: PayloadAction<string>) {
      const currentFileContent = action.payload;
      state.currentFileContent = currentFileContent;
    },
    setSelectedNodeUids(state, action: PayloadAction<TNodeUid[]>) {
      const selectedNodeUids = action.payload;
      state.selectedNodeUids = [...selectedNodeUids];
    },
  },
});
export const { setCurrentFileContent, setSelectedNodeUids } =
  nodeEventSlice.actions;
export const NodeEventReducer = undoable(nodeEventSlice.reducer, {
  limit: NodeTree_Event_StoreLimit,
  undoType: NodeTree_Event_UndoActionType,
  redoType: NodeTree_Event_RedoActionType,
  clearHistoryType: NodeTree_Event_ClearActionType,
});
