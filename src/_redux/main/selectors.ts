import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import { TEventHistoryInfo } from "./types";

const getFileAction = (state: AppState) => state.fileTree.present.fileAction;
export const fileActionSelector = createSelector(
  getFileAction,
  (fileAction) => fileAction,
);

const getFileContent = (state: AppState) => state.nodeTree.present.fileContent;
export const fileContentSelector = createSelector(
  getFileContent,
  (fileContent) => fileContent,
);

const getSelectedItems = (state: AppState) =>
  state.nodeTree.present.selectedItems;
export const selectedItemsSelector = createSelector(
  getSelectedItems,
  (selectedItems) => selectedItems,
);

const getEventHistoryInfo = (state: AppState): TEventHistoryInfo => ({
  fileTree: {
    future: state.fileTree.future.length,
    past: state.fileTree.past.length,
  },
  nodeTree: {
    future: state.nodeTree.future.length,
    past: state.nodeTree.past.length,
  },
});
export const eventHistoryInfoSelector = createSelector(
  getEventHistoryInfo,
  (eventHistoryInfo) => eventHistoryInfo,
);
