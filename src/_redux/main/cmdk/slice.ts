import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TCmdkReducerState, TCmdkReferenceData, TCommand } from "./types";

const cmdkReducerInitialState: TCmdkReducerState = {
  cmdkOpen: false,
  cmdkPages: [],
  currentCmdkPage: "",

  cmdkSearchContent: "",
  currentCommand: null,
  cmdkReferenceData: {},
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
    setCmdkReferenceData(state, action: PayloadAction<TCmdkReferenceData>) {
      const cmdkReferenceData = action.payload;
      state.cmdkReferenceData = cmdkReferenceData;
    },
  },
});
export const {
  setCmdkOpen,
  setCmdkPages,
  setCurrentCmdkPage,

  setCmdkSearchContent,
  setCurrentCommand,
  setCmdkReferenceData,
} = cmdkSlice.actions;
export const CmdkReduer = cmdkSlice.reducer;
