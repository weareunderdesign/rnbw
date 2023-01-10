import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

/* *********************** global *********************** */
// action group index selector
const getActionGroupIndex = (state: AppState) => state.main.present.actionGroupIndex
export const getActionGroupIndexSelector = createSelector(getActionGroupIndex, (actionGroupIndex) => actionGroupIndex)

// global selector
const getGlobal = (state: AppState) => state.main.present.global
export const globalSelector = createSelector(getGlobal, (global) => global)

/* *********************** fn *********************** */
// fn selector
const getFN = (state: AppState) => state.main.present.fn
export const fnSelector = createSelector(getFN, (fn) => fn)

/* *********************** ff *********************** */
// ff selector
const getFF = (state: AppState) => state.main.present.ff
export const ffSelector = createSelector(getFF, (ff) => ff)

/* *********************** hms *********************** */
// info - future & past length
const getHmsInfo = (state: AppState) => ({ futureLength: state.main.future.length, pastLength: state.main.past.length })
export const hmsInfoSelector = createSelector(getHmsInfo, (hmsInfo) => hmsInfo)