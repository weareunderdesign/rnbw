import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCodeViewReducerState } from "./types";
import { TNodeUid } from "@_node/types";

const codeViewReducerInitialState: TCodeViewReducerState = {
  editingNodeUid: "",
  codeViewTabSize: 4,
};
const codeViewSlice = createSlice({
  name: "codeView",
  initialState: codeViewReducerInitialState,
  reducers: {
    setEditingNodeUidInCodeView(state, action: PayloadAction<TNodeUid>) {
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
