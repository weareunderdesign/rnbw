import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
  TPanelContext,
  TProcessorReducerState,
} from "./types";

const processorReducerInitialState: TProcessorReducerState = {
  doingAction: false,

  navigatorDropdownType: null,
  favicon: "",

  activePanel: "none",
  clipboardData: null,

  showActionsPanel: true,
  showCodeView: true,

  autoSave: false,
  formatCode: false,

  didUndo: false,
  didRedo: false,
  loading: 0,
};
const processorSlice = createSlice({
  name: "processor",
  initialState: processorReducerInitialState,
  reducers: {
    setDoingAction(state, action: PayloadAction<boolean>) {
      const doingAction = action.payload;
      state.doingAction = doingAction;
    },
    setNavigatorDropdownType(
      state,
      action: PayloadAction<TNavigatorDropdownType>,
    ) {
      const navigatorDropdownType = action.payload;
      state.navigatorDropdownType = navigatorDropdownType;
    },
    setFavicon(state, action: PayloadAction<string>) {
      const favicon = action.payload;
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

    setAutoSave(state, action: PayloadAction<boolean>) {
      const autoSave = action.payload;
      state.autoSave = autoSave;
    },

    setFormatCode(state, action: PayloadAction<boolean>) {
      const formatCode = action.payload;
      state.formatCode = formatCode;
    },

    setDidUndo(state, action: PayloadAction<boolean>) {
      const didUndo = action.payload;
      state.didUndo = didUndo;
    },
    setDidRedo(state, action: PayloadAction<boolean>) {
      const didRedo = action.payload;
      state.didRedo = didRedo;
    },
    setLoadingTrue(state) {
      state.loading += 1;
    },
    setLoadingFalse(state) {
      state.loading = Math.max(0, state.loading - 1);
    },
  },
});
export const {
  setDoingAction,

  setNavigatorDropdownType,
  setFavicon,

  setActivePanel,
  setClipboardData,

  setShowActionsPanel,
  setShowCodeView,

  setAutoSave,
  setFormatCode,

  setDidUndo,
  setDidRedo,
  setLoadingTrue,
  setLoadingFalse,
} = processorSlice.actions;
export const ProcessorReduer = processorSlice.reducer;
