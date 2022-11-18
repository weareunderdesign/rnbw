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
  selectedItems: [],
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
    },
    collapseFNNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.expandedItems = state.expandedItems.filter(u => u !== uid)
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.selectedItems = uids
    },
  },
})

// export the actions and reducer
export const { focusFNNode, expandFNNode, collapseFNNode, selectFNNode } = slice.actions
export const FNReducer = slice.reducer