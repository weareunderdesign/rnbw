import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCmdkReducerState, TCommand } from "./types";

const cmdkReducerInitialState: TCmdkReducerState = {
  cmdkOpen: false,
  cmdkPages: [],
  currentCmdkPage: "",

  cmdkSearchContent: "",
  currentCommand: null,
};
const cmdkSlice = createSlice({
  name: "cmdk",
  initialState: cmdkReducerInitialState,
  reducers: {
    setCmdkOpen(state, action: PayloadAction<boolean>) {
      const cmdkOpen = action.payload;
      state.cmdkOpen = cmdkOpen;
    },
    setCmdkPages(state, action: PayloadAction<string[]>) {
      const cmdkPages = action.payload;
      state.cmdkPages = cmdkPages;
    },
    setCurrentCmdkPage(state, action: PayloadAction<string>) {
      const currentCmdkPage = action.payload;
      state.currentCmdkPage = currentCmdkPage;
    },

    setCmdkSearchContent(state, action: PayloadAction<string>) {
      const cmdkSearchContent = action.payload;
      state.cmdkSearchContent = cmdkSearchContent;
    },
    setCurrentCommand(state, action: PayloadAction<TCommand>) {
      const currentCommand = action.payload;
      state.currentCommand = currentCommand;
    },
  },
});
export const {
  setCmdkOpen,
  setCmdkPages,
  setCurrentCmdkPage,

  setCmdkSearchContent,
  setCurrentCommand,
} = cmdkSlice.actions;
export const CmdkReduer = cmdkSlice.reducer;
