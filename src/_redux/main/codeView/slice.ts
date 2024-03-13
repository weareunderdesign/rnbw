import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCodeViewReducerState } from "./types";
import { TNodeUid } from "@_node/types";

const codeViewReducerInitialState: TCodeViewReducerState = {
  editingNodeUid: null,
  codeViewTabSize: 4,
  codeErrors: false,
};
const codeViewSlice = createSlice({
  name: "codeView",
  initialState: codeViewReducerInitialState,
  reducers: {
    setEditingNodeUidInCodeView(state, action: PayloadAction<TNodeUid | null>) {
      const editingNodeUid = action.payload;
      state.editingNodeUid = editingNodeUid;
    },
    setCodeViewTabSize(state, action: PayloadAction<number>) {
      const codeViewTabSize = action.payload;
      state.codeViewTabSize = codeViewTabSize;
    },
    setCodeErrors(state, action: PayloadAction<boolean>) {
      const codeErrors = action.payload;
      state.codeErrors = codeErrors;
    },
  },
});
export const {
  setEditingNodeUidInCodeView,
  setCodeViewTabSize,
  setCodeErrors,
} = codeViewSlice.actions;
export const CodeViewReducer = codeViewSlice.reducer;
