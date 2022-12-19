import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

/* *********************** main *********************** */
// action group index selector
const mainGetActionGroupIndex = (state: AppState) => state.main.present.actionGroupIndex
export const mainGetActionGroupIndexSelector = createSelector(mainGetActionGroupIndex, (actionGroupIndex) => actionGroupIndex)

/* *********************** global *********************** */
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