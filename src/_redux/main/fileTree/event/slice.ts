import undoable from "redux-undo";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  FileTree_Event_ClearActionType,
  FileTree_Event_RedoActionType,
  FileTree_Event_StoreLimit,
  FileTree_Event_UndoActionType,
} from "./constants";
import { TFileAction, TFileEventReducerState } from "./types";

const fileEventReducerInitialState: TFileEventReducerState = {
  fileAction: {
    action: null,
  },
};
const fileEventSlice = createSlice({
  name: "fileEvent",
  initialState: fileEventReducerInitialState,
  reducers: {
    setFileAction(state, action: PayloadAction<TFileAction>) {
      const fileAction = action.payload;
      state.fileAction = fileAction;
    },
  },
});
export const { setFileAction } = fileEventSlice.actions;
export const FileEventReducer = undoable(fileEventSlice.reducer, {
  limit: FileTree_Event_StoreLimit,
  undoType: FileTree_Event_UndoActionType,
  redoType: FileTree_Event_RedoActionType,
  clearHistoryType: FileTree_Event_ClearActionType,

  groupBy: (action, currentState, previousHistory) => {
    if (action.type === "fileEvent/setFileAction") {
      const fileAction = action.payload as TFileAction;
      if (!fileAction.action) return "null";
    }
    return null;
  },
});
