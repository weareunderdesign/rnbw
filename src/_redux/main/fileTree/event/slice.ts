import undoable from "redux-undo";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  FileTree_Event_ClearActionType,
  FileTree_Event_RedoActionType,
  FileTree_Event_StoreLimit,
  FileTree_Event_UndoActionType,
} from "./constants";
import { TFileAction, TFileTreeEventReducerState } from "./types";

const fileTreeEventReducerInitialState: TFileTreeEventReducerState = {
  fileAction: {
    type: null,
  },
};
const fileTreeEventSlice = createSlice({
  name: "event",
  initialState: fileTreeEventReducerInitialState,
  reducers: {
    setFileAction(state, action: PayloadAction<TFileAction>) {
      const fileAction = action.payload;
      state.fileAction = fileAction;
    },
  },
});
export const { setFileAction } = fileTreeEventSlice.actions;
export const FileTreeEventReducer = undoable(fileTreeEventSlice.reducer, {
  limit: FileTree_Event_StoreLimit,
  undoType: FileTree_Event_UndoActionType,
  redoType: FileTree_Event_RedoActionType,
  clearHistoryType: FileTree_Event_ClearActionType,
});
