import { TUid } from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.FFTreeViewState = {
  focusedItem: '',
  expandedItems: [],
  expandedItemsObj: {},
  selectedItems: [],
  selectedItemsObj: {},
}
// create the slice
const slice = createSlice({
  name: 'ff',
  initialState,
  reducers: {
    focusFFNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.focusedItem = uid
    },
    expandFFNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.expandedItems.push(uid)
      state.expandedItemsObj[uid] = true
    },
    collapseFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    selectFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.selectedItems = uids
      state.selectedItemsObj = {}
      for (const uid of uids) {
        state.selectedItemsObj[uid] = true
      }
    },
  },
})

// export the actions and reducer
export const { focusFFNode, expandFFNode, collapseFFNode, selectFFNode } = slice.actions
export const FFReducer = slice.reducer