import undoable from 'redux-undo';

import { TTree, TUid } from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.MainState = {
  global: {
    workspace: {},
    nodetree: {},
    currentFile: {
      uid: '',
      name: '',
      type: 'unknown',
      content: '',
      saved: false,
    },
    pending: false,
    error: null,
  },
  ff: {
    focusedItem: 'root',
    expandedItems: ['root'],
    expandedItemsObj: { 'root': true },
    selectedItems: [],
    selectedItemsObj: {},
  },
  fn: {
    focusedItem: 'root',
    expandedItems: ['root'],
    expandedItemsObj: { 'root': true },
    selectedItems: [],
    selectedItemsObj: {},
  },
}

// create the slice
const slice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    /* main */
    clearMainState(state, action: PayloadAction) {
      // console.log(action)
      state.global = initialState.global
      state.ff = initialState.ff
      state.fn = initialState.fn
    },

    /* global */
    clearGlobalState(state, action: PayloadAction) {
      console.log(action)
      state.global = initialState.global
    },
    setFileContent(state, action: PayloadAction<Types.OpenedFile>) {
      console.log(action)
      const payload = action.payload
      state.global.currentFile = payload
    },
    updateFileContent(state, action: PayloadAction<string>) {
      console.log(action)
      const data = action.payload
      state.global.currentFile.content = data
    },
    setGlobalPending(state, action: PayloadAction<boolean>) {
      state.global.pending = action.payload
    },
    setGlobalError(state, action: PayloadAction<Types._Error>) {
      console.log(action)
      const error = action.payload
      state.global.error = error
    },

    /* fn */
    clearFNState(state, action: PayloadAction) {
      console.log(action)
      state.fn = initialState.fn
    },
    focusFNNode(state, action: PayloadAction<TUid>) {
      console.log(action)
      const uid = action.payload
      state.fn.focusedItem = uid
    },
    expandFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        state.fn.expandedItemsObj[uid] = true
      }
      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
    },
    collapseFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        delete state.fn.expandedItemsObj[uid]
      }
      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      state.fn.selectedItems = uids
      state.fn.selectedItemsObj = {}
      for (const uid of uids) {
        state.fn.selectedItemsObj[uid] = true
      }
    },
    updateFNNode(state, action: PayloadAction<Types.UpdateFNNodePayload>) {
      console.log(action)
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        for (const uid of deletedUids) {
          if (state.fn.focusedItem === uid) {
            state.fn.focusedItem = ''
          }
          delete state.fn.expandedItemsObj[uid]
          delete state.fn.selectedItemsObj[uid]
        }
      }
      if (convertedUids) {
        for (const [prev, cur] of convertedUids) {
          if (state.fn.expandedItemsObj[prev]) {
            delete state.fn.expandedItemsObj[prev]
            state.fn.expandedItemsObj[cur] = true
          }
          if (state.fn.selectedItemsObj[prev]) {
            delete state.fn.selectedItemsObj[prev]
            state.fn.selectedItemsObj[cur] = true
          }
        }
      }
      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
      state.fn.selectedItems = Object.keys(state.fn.selectedItemsObj)
    },
    updateTTree(state, action: PayloadAction<TTree>) {
      const treeData = action.payload
      state.global.nodetree = treeData
    },

    /* ff */
    focusFFNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.ff.focusedItem = uid
    },
    expandFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.ff.expandedItemsObj[uid] = true
      }
      state.ff.expandedItems = Object.keys(state.ff.expandedItemsObj)
    },
    collapseFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.ff.expandedItemsObj[uid]
      }
      state.ff.expandedItems = Object.keys(state.ff.expandedItemsObj)
    },
    selectFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.ff.selectedItems = uids
      state.ff.selectedItemsObj = {}
      for (const uid of uids) {
        state.ff.selectedItemsObj[uid] = true
      }
    },
    updateFFTreeView(state, action: PayloadAction<Types.UpdateFFTreeViewPayload>) {
      const { deletedUids, nodes } = action.payload
      if (deletedUids) {
        for (const uid of deletedUids) {
          delete state.global.workspace[uid]
        }
      }
      if (nodes) {
        for (const node of nodes) {
          state.global.workspace[node.uid] = node
        }
      }
    },
    updateFFTreeViewState(state, action: PayloadAction<Types.UpdateFFTreeViewStatePayload>) {
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        for (const uid of deletedUids) {
          if (state.ff.focusedItem === uid) {
            state.ff.focusedItem = ''
          }
          delete state.ff.expandedItemsObj[uid]
          delete state.ff.selectedItemsObj[uid]
        }
      }
      if (convertedUids) {
        for (const [prev, cur] of convertedUids) {
          if (state.ff.expandedItemsObj[prev]) {
            delete state.ff.expandedItemsObj[prev]
            state.ff.expandedItemsObj[cur] = true
          }
          if (state.ff.selectedItemsObj[prev]) {
            delete state.ff.selectedItemsObj[prev]
            state.ff.selectedItemsObj[cur] = true
          }
        }
      }
      state.ff.expandedItems = Object.keys(state.ff.expandedItemsObj)
      state.ff.selectedItems = Object.keys(state.ff.selectedItemsObj)
    },
  },
})

// export the actions and reducer
export const {
  /* naub */
  clearMainState,

  /* global */
  clearGlobalState,
  setFileContent,
  updateFileContent,
  setGlobalPending,
  setGlobalError,

  /* fn */
  clearFNState,
  focusFNNode,
  expandFNNode,
  collapseFNNode,
  selectFNNode,
  updateFNNode,
  updateTTree,

  /* ff */
  focusFFNode,
  expandFFNode,
  collapseFFNode,
  selectFFNode,
  updateFFTreeView,
  updateFFTreeViewState,
} = slice.actions

export const MainReducer = undoable(slice.reducer, {
  filter: function filterActions(action, currentState, previousHistory) {
    /* remove message-toast and spinner-pending */
    if (action.type === 'main/setGlobalError' ||
      action.type === 'main/setGlobalPending') {
      return false
    }

    return true
  },
  groupBy: (action, currentState, previousHistory) => {

  },
  limit: 10000,/* limit the history stack size to 10,000 */
})