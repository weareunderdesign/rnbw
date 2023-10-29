import { AppState } from '@_redux/_root';
import { TEventHistoryInfo } from '@_redux/main/types';
import { createSelector } from '@reduxjs/toolkit';

const getCurrentFileContent = (state: AppState) =>
  state.main.nodeTreeEvent.present.currentFileContent;
export const currentFileContentSelector = createSelector(
  getCurrentFileContent,
  (currentFileContent) => currentFileContent,
);

const getSelectedNodeUids = (state: AppState) =>
  state.main.nodeTreeEvent.present.selectedNodeUids;
export const selectedNodeUidsSelector = createSelector(
  getSelectedNodeUids,
  (selectedNodeUids) => selectedNodeUids,
);

const getNodeEvent = (state: AppState) =>
  state.main.nodeTreeEvent.present.nodeEvent;
export const nodeEventSelector = createSelector(
  getNodeEvent,
  (nodeEvent) => nodeEvent,
);

const getNodeTreeEventHistoryInfo = (state: AppState): TEventHistoryInfo => ({
  future: state.main.nodeTreeEvent.future.length,
  past: state.main.nodeTreeEvent.past.length,
});
export const nodeTreeEventHistoryInfoSelector = createSelector(
  getNodeTreeEventHistoryInfo,
  (nodeTreeEventHistoryInfo) => nodeTreeEventHistoryInfo,
);
