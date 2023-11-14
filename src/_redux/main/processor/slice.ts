import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
  TPanelContext,
  TProcessorReducerState,
} from "./types";

const processorReducerInitialState: TProcessorReducerState = {
  navigatorDropdownType: null,
  favicon: "",

  activePanel: "none",
  clipboardData: null,

  showActionsPanel: true,
  showCodeView: true,

  didUndo: false,
  didRedo: false,
};
const processorSlice = createSlice({
  name: "processor",
  initialState: processorReducerInitialState,
  reducers: {
    setNavigatorDropdownType(
      state,
      actions: PayloadAction<TNavigatorDropdownType>,
    ) {
      const navigatorDropdownType = actions.payload;
      state.navigatorDropdownType = navigatorDropdownType;
    },
    setFavicon(state, actions: PayloadAction<string>) {
      const favicon = actions.payload;
      state.favicon = favicon;
    },

    setActivePanel(state, action: PayloadAction<TPanelContext>) {
      const activePanel = action.payload;
      state.activePanel = activePanel;
    },
    setClipboardData(state, action: PayloadAction<TClipboardData | null>) {
      const clipboardData = action.payload;
      state.clipboardData = clipboardData;
    },

    setShowActionsPanel(state, action: PayloadAction<boolean>) {
      const showActionsPanel = action.payload;
      state.showActionsPanel = showActionsPanel;
    },
    setShowCodeView(state, action: PayloadAction<boolean>) {
      const showCodeView = action.payload;
      state.showCodeView = showCodeView;
    },

    setDidUndo(state, action: PayloadAction<boolean>) {
      const didUndo = action.payload;
      state.didUndo = didUndo;
    },
    setDidRedo(state, action: PayloadAction<boolean>) {
      const didRedo = action.payload;
      state.didRedo = didRedo;
    },
  },
});
export const {
  setNavigatorDropdownType,
  setFavicon,

  setActivePanel,
  setClipboardData,

  setShowActionsPanel,
  setShowCodeView,

  setDidUndo,
  setDidRedo,
} = processorSlice.actions;
export const ProcessorReduer = processorSlice.reducer;
