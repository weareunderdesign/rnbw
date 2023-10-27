import undoable from "redux-undo";

import { TNodeUid } from "@_node/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  NodeTree_Event_ClearActionType,
  NodeTree_Event_RedoActionType,
  NodeTree_Event_StoreLimit,
  NodeTree_Event_UndoActionType,
} from "./constants";
import { TNodeEvent, TNodeTreeEventReducerState } from "./types";

const nodeTreeEventReducerInitialState: TNodeTreeEventReducerState = {
  fileContent: "",
  selectedNodeUids: [],
  nodeEvent: null,
};
const nodeTreeEventSlice = createSlice({
  name: "nodeTreeEvent",
  initialState: nodeTreeEventReducerInitialState,
  reducers: {
    setFileContent(state, action: PayloadAction<string>) {
      const fileContent = action.payload;
      state.fileContent = fileContent;
    },
    setSelectedItems(state, action: PayloadAction<TNodeUid[]>) {
      const selectedNodeUids = action.payload;
      state.selectedNodeUids = [...selectedNodeUids];
    },
    setNodeEvent(state, action: PayloadAction<TNodeEvent>) {
      const nodeEvent = action.payload;
      state.nodeEvent = nodeEvent;
    },
  },
});
export const { setFileContent, setSelectedItems, setNodeEvent } =
  nodeTreeEventSlice.actions;
export const NodeTreeEventReducer = undoable(nodeTreeEventSlice.reducer, {
  limit: NodeTree_Event_StoreLimit,
  undoType: NodeTree_Event_UndoActionType,
  redoType: NodeTree_Event_RedoActionType,
  clearHistoryType: NodeTree_Event_ClearActionType,
});
