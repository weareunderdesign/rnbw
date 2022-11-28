import { TUid } from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.FFTreeViewState = {
  focusedItem: 'root',
  expandedItems: ['root'],
  expandedItemsObj: { 'root': true },
  selectedItems: [],
  selectedItemsObj: {},
}
// create the slice
const slice = createSlice({
  name: 'ff',
  initialState,
  reducers: {
    clearFFState(state, action: PayloadAction) {
      console.log(action)
      state.focusedItem = initialState.focusedItem
      state.expandedItems = initialState.expandedItems
      state.expandedItemsObj = initialState.expandedItemsObj
      state.selectedItems = initialState.selectedItems
      state.selectedItemsObj = initialState.selectedItemsObj
    },
    focusFFNode(state, action: PayloadAction<TUid>) {
      console.log(action)
      const uid = action.payload
      state.focusedItem = uid
    },
    expandFFNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        state.expandedItemsObj[uid] = true
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    collapseFFNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    selectFFNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      state.selectedItems = uids
      state.selectedItemsObj = {}
      for (const uid of uids) {
        state.selectedItemsObj[uid] = true
      }
    },
    updateFFNode(state, action: PayloadAction<Types.UpdateFFNodePayload>) {
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        for (const uid of deletedUids) {
          if (state.focusedItem === uid) {
            state.focusedItem = ''
          }
          delete state.expandedItemsObj[uid]
          delete state.selectedItemsObj[uid]
        }
      }
      if (convertedUids) {
        for (const [prev, cur] of convertedUids) {
          if (state.expandedItemsObj[prev]) {
            delete state.expandedItemsObj[prev]
            state.expandedItemsObj[cur] = true
          }
          if (state.selectedItemsObj[prev]) {
            delete state.selectedItemsObj[prev]
            state.selectedItemsObj[cur] = true
          }
        }
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
      state.selectedItems = Object.keys(state.selectedItemsObj)
    },
  },
})

// export the actions and reducer
export const { clearFFState, focusFFNode, expandFFNode, collapseFFNode, selectFFNode, updateFFNode } = slice.actions
export const FFReducer = slice.reducer