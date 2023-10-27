import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TStageViewReducerState } from "./types";

const stageViewReducerInitialState: TStageViewReducerState = {
  iframeSrc: null,
  iframeLoading: false,
  needToReloadIFrame: false,
  linkToOpen: null,
};
const stageViewSlice = createSlice({
  name: "stageView",
  initialState: stageViewReducerInitialState,
  reducers: {
    setIframeSrc(state, actions: PayloadAction<string | null>) {
      const iframeSrc = actions.payload;
      state.iframeSrc = iframeSrc;
    },
    setIframeLoading(state, actions: PayloadAction<boolean>) {
      const iframeLoading = actions.payload;
      state.iframeLoading = iframeLoading;
    },
    setNeedToReloadIFrame(state, actions: PayloadAction<boolean>) {
      const needToReloadIFrame = actions.payload;
      state.needToReloadIFrame = needToReloadIFrame;
    },
    setLinkToOpen(state, actions: PayloadAction<string | null>) {
      const linkToOpen = actions.payload;
      state.linkToOpen = linkToOpen;
    },
  },
});
export const {
  setIframeSrc,
  setIframeLoading,
  setNeedToReloadIFrame,
  setLinkToOpen,
} = stageViewSlice.actions;
export const StageViewReducer = stageViewSlice.reducer;
