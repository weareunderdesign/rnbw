import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCodeViewReducerState } from "./types";
import { TNodeUid } from "@_node/types";

const codeViewReducerInitialState: TCodeViewReducerState = {
  editingNodeUid: null,
  codeViewTabSize: 4,
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
  },
});
export const { setEditingNodeUidInCodeView, setCodeViewTabSize } =
  codeViewSlice.actions;
export const CodeViewReduer = codeViewSlice.reducer;
