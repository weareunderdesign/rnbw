import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

const getCodeViewTabSize = (state: AppState): number =>
  state.main.codeView.codeViewTabSize;
export const codeViewTabSizeSelector = (state: AppState): number => {
  return getCodeViewTabSize(state);
};

const getCodeEditing = (state: AppState): boolean =>
  state.main.codeView.codeEditing;
export const codeEditingSelector = createSelector(
  getCodeEditing,
  (codeEditing) => codeEditing,
);
