import { TUid } from '@_node/types';
import { FFNodeActionRenamePayloadRes } from '@_types/ff';
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
    expandFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.expandedItems.push(uid)
        state.expandedItemsObj[uid] = true
      }
    },
    collapseFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
      }
      state.expandedItems = state.expandedItems.filter(uid => state.expandedItemsObj[uid])
    },
    selectFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.selectedItems = uids
      state.selectedItemsObj = {}
      for (const uid of uids) {
        state.selectedItemsObj[uid] = true
      }
    },
    setRenamedFFNodes(state, action: PayloadAction<FFNodeActionRenamePayloadRes>) {
      const { nodes } = action.payload
      for (const node of nodes) {
        if (state.expandedItemsObj[node.data]) {
          state.expandedItemsObj[node.uid] = true
        }
        if (state.selectedItemsObj[node.data]) {
          state.selectedItemsObj[node.uid] = true
        }
        delete state.expandedItemsObj[node.data]
        delete state.selectedItemsObj[node.data]
      }
      state.expandedItems = []
      for (const uid in state.expandedItemsObj) {
        state.expandedItems.push(uid)
      }
      state.selectedItems = []
      for (const uid in state.selectedItemsObj) {
        state.selectedItems.push(uid)
      }
    },
    setRemoveFFNodes(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.expandedItemsObj[uid]
        delete state.selectedItemsObj[uid]
      }
      state.expandedItems = state.expandedItems.filter(uid => state.expandedItemsObj[uid])
      state.selectedItems = state.selectedItems.filter(uid => state.selectedItemsObj[uid])
    },
  },
})

// export the actions and reducer
export const { focusFFNode, expandFFNode, collapseFFNode, selectFFNode, setRenamedFFNodes, setRemoveFFNodes } = slice.actions
export const FFReducer = slice.reducer