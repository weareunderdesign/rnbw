import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCodeViewReducerState } from "./types";

const codeViewReducerInitialState: TCodeViewReducerState = {
  codeViewTabSize: 4,
  codeEditing: false,
};
const codeViewSlice = createSlice({
  name: "codeView",
  initialState: codeViewReducerInitialState,
  reducers: {
    setCodeViewTabSize(state, action: PayloadAction<number>) {
      const codeViewTabSize = action.payload;
      state.codeViewTabSize = codeViewTabSize;
    },
    setCodeEditing(state, action: PayloadAction<boolean>) {
      const codeEditing = action.payload;
      state.codeEditing = codeEditing;
    },
  },
});
export const { setCodeViewTabSize, setCodeEditing } = codeViewSlice.actions;
export const CodeViewReduer = codeViewSlice.reducer;
