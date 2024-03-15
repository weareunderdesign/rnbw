import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { StageViewSyncConfigs, TStageViewReducerState } from "./types";

const stageViewReducerInitialState: TStageViewReducerState = {
  iframeSrc: null,
  iframeLoading: false,
  needToReloadIframe: false,
  linkToOpen: null,
  webComponentOpen: false,
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
    setNeedToReloadIframe(state, actions: PayloadAction<boolean>) {
      const needToReloadIframe = actions.payload;
      state.needToReloadIframe = needToReloadIframe;
    },
    setLinkToOpen(state, actions: PayloadAction<string | null>) {
      const linkToOpen = actions.payload;
      state.linkToOpen = linkToOpen;
    },
    setSyncConfigs(state, action: PayloadAction<StageViewSyncConfigs>) {
      const syncConfigs = action.payload;
      state.syncConfigs = syncConfigs;
    },
    setWebComponentOpen(state, action: PayloadAction<boolean>) {
      const webComponentOpen = action.payload;
      state.webComponentOpen = webComponentOpen;
    },
  },
});
export const {
  setIframeSrc,
  setIframeLoading,
  setNeedToReloadIframe,
  setLinkToOpen,
  setSyncConfigs,
  setWebComponentOpen,
} = stageViewSlice.actions;
export const StageViewReducer = stageViewSlice.reducer;
