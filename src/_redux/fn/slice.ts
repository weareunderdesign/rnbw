import { TUid } from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.FNTreeViewState = {
  focusedItem: '',
  expandedItems: [],
  expandedItemsObj: {},
  selectedItems: [],
  selectedItemsObj: {},
}

// create the slice
const slice = createSlice({
  name: 'fn',
  initialState,
  reducers: {
    focusFNNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.focusedItem = uid
    },
    expandFNNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.expandedItems.push(uid)
      state.expandedItemsObj[uid] = true
    },
    collapseFNNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      delete state.expandedItemsObj[uid]
      state.expandedItems = Object.keys(state.expandedItemsObj)
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.selectedItems = uids
      state.selectedItemsObj = {}
      for (const uid of uids) {
        state.selectedItemsObj[uid] = true
      }
    },
    updateFNNode(state, action: PayloadAction<Types.UpdateFNNodePayload>) {
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
export const { focusFNNode, expandFNNode, collapseFNNode, selectFNNode, updateFNNode } = slice.actions
export const FNReducer = slice.reducer