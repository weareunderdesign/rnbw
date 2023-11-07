import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
  TPanelContext,
  TProcessorReducerState,
  TUpdateOptions,
} from "./types";

const processorReducerInitialState: TProcessorReducerState = {
  navigatorDropdownType: null,
  favicon: "",

  activePanel: "none",
  clipboardData: null,

  showActionsPanel: false,
  showCodeView: false,

  didUndo: false,
  didRedo: false,

  updateOptions: null,
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

    setUpdateOptions(state, action: PayloadAction<TUpdateOptions | null>) {
      const updateOptions = action.payload;
      state.updateOptions = updateOptions;
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

  setUpdateOptions,
} = processorSlice.actions;
export const ProcessorReduer = processorSlice.reducer;
