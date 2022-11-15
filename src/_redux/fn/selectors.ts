import { createSelector } from 'reselect';

import { AppState } from '@redux/_root';

// focusedItem selector
const fnGetFocusedItem = (state: AppState) => state.fn.focusedItem
export const fnGetFocusedItemSelector = createSelector(fnGetFocusedItem, (focusedItem) => focusedItem)

// expandedItems selector
const fnGetExpandedItems = (state: AppState) => state.fn.expandedItems
export const fnGetExpandedItemsSelector = createSelector(fnGetExpandedItems, (expandedItems) => expandedItems)

// selectedItems selector
const fnGetSelectedItems = (state: AppState) => state.fn.selectedItems
export const fnGetSelectedItemsSelector = createSelector(fnGetSelectedItems, (selectedItems) => selectedItems)