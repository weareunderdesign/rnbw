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
    expandFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.expandedItems.push(uid)
        state.expandedItemsObj[uid] = true
      }
    },
    collapseFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
      }
      state.expandedItems = state.expandedItems.filter(uid => state.expandedItemsObj[uid])
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
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
export const { focusFNNode, expandFNNode, collapseFNNode, selectFNNode } = slice.actions
export const FNReducer = slice.reducer