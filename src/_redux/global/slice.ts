import { createSlice } from "@reduxjs/toolkit";

import { TGlobalReducerState } from "./types";

const globalReducerInitialState: TGlobalReducerState = {};
const slice = createSlice({
  name: "global",
  initialState: globalReducerInitialState,
  reducers: {},
});
export const {} = slice.actions;
export const GlobalReducer = slice.reducer;
