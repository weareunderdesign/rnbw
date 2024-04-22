import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { StageViewSyncConfigs, TStageViewReducerState } from "./types";

const stageViewReducerInitialState: TStageViewReducerState = {
  iframeSrc: null,
  iframeLoading: false,
  linkToOpen: null,
  syncConfigs: {},
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
    setLinkToOpen(state, actions: PayloadAction<string | null>) {
      const linkToOpen = actions.payload;
      state.linkToOpen = linkToOpen;
    },
    setSyncConfigs(state, action: PayloadAction<StageViewSyncConfigs>) {
      const syncConfigs = action.payload;
      state.syncConfigs = syncConfigs;
    },
  },
});
export const { setIframeSrc, setIframeLoading, setLinkToOpen, setSyncConfigs } =
  stageViewSlice.actions;
export const StageViewReducer = stageViewSlice.reducer;
