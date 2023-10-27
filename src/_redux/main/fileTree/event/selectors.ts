import { AppState } from "@_redux/_root";
import { TEventHistoryInfo } from "@_redux/main/types";
import { createSelector } from "@reduxjs/toolkit";

const getFileAction = (state: AppState) =>
  state.main.fileTreeEvent.present.fileAction;
export const fileActionSelector = createSelector(
  getFileAction,
  (fileAction) => fileAction,
);

const getFileTreeEventHistoryInfo = (state: AppState): TEventHistoryInfo => ({
  future: state.main.fileTreeEvent.future.length,
  past: state.main.fileTreeEvent.past.length,
});
export const fileTreeEventHistoryInfoSelector = createSelector(
  getFileTreeEventHistoryInfo,
  (fileTreeEventHistoryInfo) => fileTreeEventHistoryInfo,
);
