import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

// action group index selector
const getActionGroupIndex = (state: AppState) => state.main.present.actionGroupIndex
export const getActionGroupIndexSelector = createSelector(getActionGroupIndex, (actionGroupIndex) => actionGroupIndex)

// navigator selector
const getNavigator = (state: AppState) => state.main.present.navigator
export const navigatorSelector = createSelector(getNavigator, (navigator) => navigator)

// global selector
const getGlobal = (state: AppState) => state.main.present.global
export const globalSelector = createSelector(getGlobal, (global) => global)

// node tree view state selector
const getFN = (state: AppState) => state.main.present.nodeTreeViewState
export const fnSelector = createSelector(getFN, (fn) => fn)

// file tree view state selector
const getFF = (state: AppState) => state.main.present.fileTreeViewState
export const ffSelector = createSelector(getFF, (ff) => ff)

// info - future & past length
const getHmsInfo = (state: AppState) => ({ futureLength: state.main.future.length, pastLength: state.main.past.length })
export const hmsInfoSelector = createSelector(getHmsInfo, (hmsInfo) => hmsInfo)