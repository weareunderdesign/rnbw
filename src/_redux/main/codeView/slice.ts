import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCodeViewReducerState } from "./types";

const codeViewReducerInitialState: TCodeViewReducerState = {
  codeViewTabSize: 4,
};
const codeViewSlice = createSlice({
  name: "codeView",
  initialState: codeViewReducerInitialState,
  reducers: {
    setCodeViewTabSize(state, action: PayloadAction<number>) {
      const codeViewTabSize = action.payload;
      state.codeViewTabSize = codeViewTabSize;
    },
  },
});
export const { setCodeViewTabSize } = codeViewSlice.actions;
export const CodeViewReduer = codeViewSlice.reducer;
