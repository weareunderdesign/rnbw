import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DesignViewSyncConfigs, TDesignViewReducerState } from "./types";

const DesignViewReducerInitialState: TDesignViewReducerState = {
  iframeSrc: null,
  iframeLoading: false,
  linkToOpen: null,
  syncConfigs: {},
  setReloadIframe: false,
  reloadIframe: false,
};
const DesignViewSlice = createSlice({
  name: "DesignView",
  initialState: DesignViewReducerInitialState,
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
    setSyncConfigs(state, action: PayloadAction<DesignViewSyncConfigs>) {
      const syncConfigs = action.payload;
      state.syncConfigs = syncConfigs;
    },
    // New reducer for iframe reload
    setReloadIframe: (state, action: PayloadAction<boolean>) => {
     const reloadIframe = action.payload;
     state.reloadIframe = reloadIframe;
    },
  },
});


export const { setIframeSrc, setIframeLoading, setLinkToOpen, setSyncConfigs, setReloadIframe } =
  DesignViewSlice.actions;
export const DesignViewReducer = DesignViewSlice.reducer;
