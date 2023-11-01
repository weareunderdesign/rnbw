import { AppState } from "@_redux/_root";
import { TEventHistoryInfo } from "@_redux/main/types";
import { createSelector } from "@reduxjs/toolkit";

const getFileAction = (state: AppState) =>
  state.main.fileEvent.present.fileAction;
export const fileActionSelector = createSelector(
  getFileAction,
  (fileAction) => fileAction,
);

const getFileEventHistoryInfo = (state: AppState): TEventHistoryInfo => ({
  future: state.main.fileEvent.future.length,
  past: state.main.fileEvent.past.length,
});
export const fileEventHistoryInfoSelector = createSelector(
  getFileEventHistoryInfo,
  (fileEventHistoryInfo) => fileEventHistoryInfo,
);
