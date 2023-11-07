import { AppState } from "@_redux/_root";
import { TEventHistoryInfo } from "@_redux/main/types";
import { createSelector } from "@reduxjs/toolkit";

const getCurrentFileContent = (state: AppState) =>
  state.main.nodeEvent.present.currentFileContent;
export const currentFileContentSelector = createSelector(
  getCurrentFileContent,
  (currentFileContent) => currentFileContent,
);

const getSelectedNodeUids = (state: AppState) =>
  state.main.nodeEvent.present.selectedNodeUids;
export const selectedNodeUidsSelector = createSelector(
  getSelectedNodeUids,
  (selectedNodeUids) => selectedNodeUids,
);

const getNodeEventHistoryInfo = (state: AppState): TEventHistoryInfo => ({
  future: state.main.nodeEvent.future.length,
  past: state.main.nodeEvent.past.length,
});
export const nodeEventHistoryInfoSelector = createSelector(
  getNodeEventHistoryInfo,
  (nodeEventHistoryInfo) => nodeEventHistoryInfo,
);
