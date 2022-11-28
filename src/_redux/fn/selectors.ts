import { createSelector } from 'reselect';

import { AppState } from '@_redux/_root';

// focusedItem selector
const fnGetFocusedItem = (state: AppState) => state.present.fn.focusedItem
export const fnGetFocusedItemSelector = createSelector(fnGetFocusedItem, (focusedItem) => focusedItem)

// expandedItems selector
const fnGetExpandedItems = (state: AppState) => state.present.fn.expandedItems
export const fnGetExpandedItemsSelector = createSelector(fnGetExpandedItems, (expandedItems) => expandedItems)
// expandedItemsObj selector
const fnGetExpandedItemsObj = (state: AppState) => state.present.fn.expandedItemsObj
export const fnGetExpandedItemsObjSelector = createSelector(fnGetExpandedItemsObj, (expandedItemsObj) => expandedItemsObj)

// selectedItems selector
const fnGetSelectedItems = (state: AppState) => state.present.fn.selectedItems
export const fnGetSelectedItemsSelector = createSelector(fnGetSelectedItems, (selectedItems) => selectedItems)
// selectedItemsObj selector
const fnGetSelectedItemsObj = (state: AppState) => state.present.fn.selectedItemsObj
export const fnGetSelectedItemsObjSelector = createSelector(fnGetSelectedItemsObj, (selectedItemsObj) => selectedItemsObj)