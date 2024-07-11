import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DesignViewSyncConfigs, TDesignViewReducerState } from "./types";

const DesignViewReducerInitialState: TDesignViewReducerState = {
  iframeSrc: null,
  iframeLoading: false,
  linkToOpen: null,
  syncConfigs: {},
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
  },
});
export const { setIframeSrc, setIframeLoading, setLinkToOpen, setSyncConfigs } =
  DesignViewSlice.actions;
export const DesignViewReducer = DesignViewSlice.reducer;
