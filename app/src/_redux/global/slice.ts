import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TGlobalReducerState, TOsType, TTheme } from "./types";

const globalReducerInitialState: TGlobalReducerState = {
  osType: "Windows",
  theme: "System",
};
const slice = createSlice({
  name: "global",
  initialState: globalReducerInitialState,
  reducers: {
    setOsType(state, action: PayloadAction<TOsType>) {
      const osType = action.payload;
      state.osType = osType;
    },

    setTheme(state, action: PayloadAction<TTheme>) {
      const theme = action.payload;
      state.theme = theme;
    },
  },
});
export const { setOsType, setTheme } = slice.actions;
export const GlobalReducer = slice.reducer;
