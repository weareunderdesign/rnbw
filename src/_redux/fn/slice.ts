import { TUid } from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.FNTreeViewState = {
  focusedItem: 'root',
  expandedItems: ['root'],
  expandedItemsObj: { 'root': true },
  selectedItems: [],
  selectedItemsObj: {},
}

// create the slice
const slice = createSlice({
  name: 'fn',
  initialState,
  reducers: {
    clearFNState(state, action: PayloadAction) {
      console.log(action)
      state.focusedItem = initialState.focusedItem
      state.expandedItems = initialState.expandedItems
      state.expandedItemsObj = initialState.expandedItemsObj
      state.selectedItems = initialState.selectedItems
      state.selectedItemsObj = initialState.selectedItemsObj
    },
    focusFNNode(state, action: PayloadAction<TUid>) {
      console.log(action)
      const uid = action.payload
      state.focusedItem = uid
    },
    expandFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        state.expandedItemsObj[uid] = true
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    collapseFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
      }
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      state.selectedItems = uids
      state.selectedItemsObj = {}
      for (const uid of uids) {
        state.selectedItemsObj[uid] = true
      }
    },
    updateFNNode(state, action: PayloadAction<Types.UpdateFNNodePayload>) {
      console.log(action)
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
export const { clearFNState, focusFNNode, expandFNNode, collapseFNNode, selectFNNode, updateFNNode } = slice.actions
export const FNReducer = slice.reducer