import undoable from 'redux-undo';

import { HistoryStoreLimit } from '@_config/main';
import {
  TTree,
  TUid,
} from '@_node/types';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.MainState = {
  actionGroupIndex: 0,
  global: {
    workspace: {},
    currentFile: {
      uid: '',
      name: '',
      type: 'unknown',
      content: '',
      saved: false,
    },
    nodeTree: {},
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
    increaseActionGroupIndex(state, action: PayloadAction) {
      state.actionGroupIndex++
    },
    clearMainState(state, action: PayloadAction) {
      state.global = initialState.global
      state.ff = initialState.ff
      state.fn = initialState.fn
    },

    /* global */
    setFileContent(state, action: PayloadAction<Types.OpenedFile>) {
      const payload = action.payload
      state.global.currentFile = payload
    },
    updateFileContent(state, action: PayloadAction<string>) {
      const data = action.payload
      state.global.currentFile.content = data
    },
    setGlobalPending(state, action: PayloadAction<boolean>) {
      state.global.pending = action.payload
    },
    setGlobalError(state, action: PayloadAction<Types._Error>) {
      const error = action.payload
      state.global.error = error
    },

    /* fn */
    focusFNNode(state, action: PayloadAction<TUid>) {
      const uid = action.payload
      state.fn.focusedItem = uid
    },
    expandFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.fn.expandedItemsObj[uid] = true
      }
      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
    },
    collapseFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.fn.expandedItemsObj[uid]
      }
      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
    },
    selectFNNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      state.fn.selectedItems = uids
      state.fn.selectedItemsObj = {}
      for (const uid of uids) {
        state.fn.selectedItemsObj[uid] = true
      }
    },
    updateFNTreeViewState(state, action: PayloadAction<Types.UpdateFNTreeViewStatePayload>) {
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        deletedUids.map((uid) => {
          if (state.fn.focusedItem === uid) {
            state.fn.focusedItem = ''
          }
          delete state.fn.expandedItemsObj[uid]
          delete state.fn.selectedItemsObj[uid]
        })
      }
      if (convertedUids) {
        let f_uid: TUid = ''
        const e_deletedUids: TUid[] = [], e_addedUids: TUid[] = []
        const s_deletedUids: TUid[] = [], s_addedUids: TUid[] = []

        for (const [prev, cur] of convertedUids) {
          if (state.fn.focusedItem === prev) {
            f_uid = cur
          }
          if (state.fn.expandedItemsObj[prev]) {
            e_deletedUids.push(prev)
            e_addedUids.push(cur)
          }
          if (state.fn.selectedItemsObj[prev]) {
            s_deletedUids.push(prev)
            s_addedUids.push(cur)
          }
        }

        state.fn.focusedItem = f_uid !== '' ? f_uid : state.fn.focusedItem
        e_deletedUids.map((_deletedUid) => {
          delete state.fn.expandedItemsObj[_deletedUid]
        })
        e_addedUids.map((_addedUid) => {
          state.fn.expandedItemsObj[_addedUid] = true
        })
        s_deletedUids.map((_deletedUid) => {
          delete state.fn.selectedItemsObj[_deletedUid]
        })
        s_addedUids.map((_addedUid) => {
          state.fn.selectedItemsObj[_addedUid] = true
        })
      }

      state.fn.expandedItems = Object.keys(state.fn.expandedItemsObj)
      state.fn.selectedItems = Object.keys(state.fn.selectedItemsObj)
    },
    updateFNTreeView(state, action: PayloadAction<TTree>) {
      const treeData = action.payload
      state.global.nodeTree = treeData
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
  },
})

// export the actions and reducer
export const {
  /* main */
  increaseActionGroupIndex,
  clearMainState,

  /* global */
  setFileContent,
  updateFileContent,
  setGlobalPending,
  setGlobalError,

  /* fn */
  focusFNNode,
  expandFNNode,
  collapseFNNode,
  selectFNNode,
  updateFNTreeViewState,
  updateFNTreeView,

  /* ff */
  focusFFNode,
  expandFFNode,
  collapseFFNode,
  selectFFNode,
  updateFFTreeViewState,
  updateFFTreeView,
} = slice.actions

export const MainReducer = undoable(slice.reducer, {
  filter: function filterActions(action, currentState, previousHistory) {
    // file the actions
    if (action.type === 'main/setGlobalPending' ||
      action.type === 'main/setGlobalError' ||
      action.type === 'main/updateFFTreeView' ||
      action.type === 'main/updateFFTreeViewState' ||
      action.type === 'main/updateFNTreeView') {
      return false
    }

    return true
  },
  groupBy: (action, currentState, previousHistory) => {
    if (action.type === 'main/increaseActionGroupIndex') {
      return currentState.actionGroupIndex - 1
    }
    return currentState.actionGroupIndex
  },
  limit: HistoryStoreLimit,/* limit the history stack size to HistoryStoreLimit */
})