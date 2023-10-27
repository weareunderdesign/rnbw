import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
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

    setShowActionsPanel(state, action: PayloadAction<boolean>) {
      const showActionsPanel = action.payload;
      state.showActionsPanel = showActionsPanel;
    },
    setClipboardData(state, action: PayloadAction<TClipboardData>) {
      const clipboardData = action.payload;
      state.clipboardData = clipboardData;
    },

    setDidUndo(state, action: PayloadAction<boolean>) {
      const didUndo = action.payload;
      state.didUndo = didUndo;
    },
    setDidRedo(state, action: PayloadAction<boolean>) {
      const didRedo = action.payload;
      state.didRedo = didRedo;
    },

    setUpdateOptions(state, action: PayloadAction<TUpdateOptions>) {
      const updateOptions = action.payload;
      state.updateOptions = updateOptions;
    },
  },
});
export const {
  setNavigatorDropdownType,
  setFavicon,

  setShowActionsPanel,
  setClipboardData,

  setDidUndo,
  setDidRedo,

  setUpdateOptions,
} = processorSlice.actions;
export const ProcessorReduer = processorSlice.reducer;
