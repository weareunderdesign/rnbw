import { UID } from '@_types/global';
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
  selectedItems: [],
}

// create the slice
const slice = createSlice({
  name: 'ff',
  initialState,
  reducers: {
    focusFFNode(state, action: PayloadAction<UID>) {
      const uid: UID = action.payload
      state.focusedItem = uid
    },
    expandFFNode(state, action: PayloadAction<UID>) {
      const uid: UID = action.payload
      state.expandedItems.push(uid)
    },
    collapseFFNode(state, action: PayloadAction<UID>) {
      const uid: UID = action.payload
      state.expandedItems = state.expandedItems.filter(u => u !== uid)
    },
    selectFFNode(state, action: PayloadAction<UID[]>) {
      const uids: UID[] = action.payload
      state.selectedItems = uids
    },
  },
})

// export the actions and reducer
export const { focusFFNode, expandFFNode, collapseFFNode, selectFFNode } = slice.actions
export const FFReducer = slice.reducer