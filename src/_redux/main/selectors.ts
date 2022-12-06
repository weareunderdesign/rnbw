import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

/* *********************** main *********************** */
// action group index selector
const mainGetActionGroupIndex = (state: AppState) => state.main.present.actionGroupIndex
export const mainGetActionGroupIndexSelector = createSelector(mainGetActionGroupIndex, (actionGroupIndex) => actionGroupIndex)

/* *********************** global *********************** */
// workspace selector
const globalGetWorkspace = (state: AppState) => state.main.present.global.workspace
export const globalGetWorkspaceSelector = createSelector(globalGetWorkspace, (workspace) => workspace)

// currentFile selector
const globalGetCurrentFile = (state: AppState) => state.main.present.global.currentFile
export const globalGetCurrentFileSelector = createSelector(globalGetCurrentFile, (currentFile) => currentFile)

// nodeTree selector
const globalGetNodeTree = (state: AppState) => state.main.present.global.nodeTree
export const globalGetNodeTreeSelector = createSelector(globalGetNodeTree, (nodeTree) => nodeTree)

// pending selector
const globalGetPending = (state: AppState) => state.main.present.global.pending
export const globalGetPendingSelector = createSelector(globalGetPending, (pending) => pending)

// globalError selector
const globalGetError = (state: AppState) => state.main.present.global.error
export const globalGetErrorSelector = createSelector(globalGetError, (error) => error)

/* *********************** fn *********************** */

// focusedItem selector
const fnGetFocusedItem = (state: AppState) => state.main.present.fn.focusedItem
export const fnGetFocusedItemSelector = createSelector(fnGetFocusedItem, (focusedItem) => focusedItem)

// expandedItems selector
const fnGetExpandedItems = (state: AppState) => state.main.present.fn.expandedItems
export const fnGetExpandedItemsSelector = createSelector(fnGetExpandedItems, (expandedItems) => expandedItems)
// expandedItemsObj selector
const fnGetExpandedItemsObj = (state: AppState) => state.main.present.fn.expandedItemsObj
export const fnGetExpandedItemsObjSelector = createSelector(fnGetExpandedItemsObj, (expandedItemsObj) => expandedItemsObj)

// selectedItems selector
const fnGetSelectedItems = (state: AppState) => state.main.present.fn.selectedItems
export const fnGetSelectedItemsSelector = createSelector(fnGetSelectedItems, (selectedItems) => selectedItems)
// selectedItemsObj selector
const fnGetSelectedItemsObj = (state: AppState) => state.main.present.fn.selectedItemsObj
export const fnGetSelectedItemsObjSelector = createSelector(fnGetSelectedItemsObj, (selectedItemsObj) => selectedItemsObj)

/* *********************** ff *********************** */
// focusedItem selector
const ffGetFocusedItem = (state: AppState) => state.main.present.ff.focusedItem
export const ffGetFocusedItemSelector = createSelector(ffGetFocusedItem, (focusedItem) => focusedItem)

// expandedItems selector
const ffGetExpandedItems = (state: AppState) => state.main.present.ff.expandedItems
export const ffGetExpandedItemsSelector = createSelector(ffGetExpandedItems, (expandedItems) => expandedItems)
// expandedItemsObj selector
const ffGetExpandedItemsObj = (state: AppState) => state.main.present.ff.expandedItemsObj
export const ffGetExpandedItemsObjSelector = createSelector(ffGetExpandedItemsObj, (expandedItemsObj) => expandedItemsObj)

// selectedItems selector
const ffGetSelectedItems = (state: AppState) => state.main.present.ff.selectedItems
export const ffGetSelectedItemsSelector = createSelector(ffGetSelectedItems, (selectedItems) => selectedItems)
// selectedItemsObj selector
const ffGetSelectedItemsObj = (state: AppState) => state.main.present.ff.selectedItemsObj
export const ffGetSelectedItemsObjSelector = createSelector(ffGetSelectedItemsObj, (selectedItemsObj) => selectedItemsObj)