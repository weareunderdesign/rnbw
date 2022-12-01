import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

/* *********************** main page *********************** */
// main page action group index
const mainPageActoinGroupIndex = (state: AppState) => state.global.mainPageActoinGroupIndex
export const globalGetWorkspaceSelector = createSelector(mainPageActoinGroupIndex, (mainPageActoinGroupIndex) => mainPageActoinGroupIndex)