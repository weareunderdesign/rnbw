import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import {
  TClipboardData,
  TNavigatorDropdownType,
  TPanelContext,
  TUpdateOptions,
} from "./types";

const getNavigatorDropdownType = (state: AppState): TNavigatorDropdownType =>
  state.main.processor.navigatorDropdownType;
export const navigatorDropdownTypeSelector = createSelector(
  getNavigatorDropdownType,
  (navigatorDropdownType) => navigatorDropdownType,
);

const getFavicon = (state: AppState): string => state.main.processor.favicon;
export const faviconSelector = createSelector(getFavicon, (favicon) => favicon);

const getActivePanel = (state: AppState): TPanelContext =>
  state.main.processor.activePanel;
export const activePanelSelector = createSelector(
  getActivePanel,
  (activePanel) => activePanel,
);

const getClipboardData = (state: AppState): TClipboardData =>
  state.main.processor.clipboardData;
export const clipboardDataSelector = createSelector(
  getClipboardData,
  (clipboardData) => clipboardData,
);

const getShowActionsPanel = (state: AppState): boolean =>
  state.main.processor.showActionsPanel;
export const showActionsPanelSelector = createSelector(
  getShowActionsPanel,
  (showActionsPanel) => showActionsPanel,
);

const getShowCodeView = (state: AppState): boolean =>
  state.main.processor.showActionsPanel;
export const showCodeViewSelector = createSelector(
  getShowCodeView,
  (showCodeView) => showCodeView,
);

const getDidUndo = (state: AppState): boolean => state.main.processor.didUndo;
export const didUndoSelector = createSelector(getDidUndo, (didUndo) => didUndo);

const getDidRedo = (state: AppState): boolean => state.main.processor.didRedo;
export const didRedoSelector = createSelector(getDidRedo, (didUndo) => didUndo);

const getUpdateOptions = (state: AppState): TUpdateOptions =>
  state.main.processor.updateOptions;
export const updateOptionsSelector = createSelector(
  getUpdateOptions,
  (updateOptions) => updateOptions,
);
