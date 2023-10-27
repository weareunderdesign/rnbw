import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCmdkReducerState, TCommand } from "./types";

const cmdkReducerInitialState: TCmdkReducerState = {
  cmdkOpen: false,
  cmdkPages: [],
  currentCmdkPage: null,

  currentCommand: null,
};
const cmdkSlice = createSlice({
  name: "cmdk",
  initialState: cmdkReducerInitialState,
  reducers: {
    setCmdkOpen(state, actions: PayloadAction<boolean>) {
      const cmdkOpen = actions.payload;
      state.cmdkOpen = cmdkOpen;
    },
    setCmdkPages(state, actions: PayloadAction<string[]>) {
      const cmdkPages = actions.payload;
      state.cmdkPages = cmdkPages;
    },
    setCurrentCmdkPage(state, actions: PayloadAction<string>) {
      const currentCmdkPage = actions.payload;
      state.currentCmdkPage = currentCmdkPage;
    },

    setCurrentCommand(state, actions: PayloadAction<TCommand>) {
      const currentCommand = actions.payload;
      state.currentCommand = currentCommand;
    },
  },
});
export const {
  setCmdkOpen,
  setCmdkPages,
  setCurrentCmdkPage,

  setCurrentCommand,
} = cmdkSlice.actions;
export const CmdkReduer = cmdkSlice.reducer;
