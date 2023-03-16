import undoable from 'redux-undo';

import {
  HistoryStoreLimit,
  HmsClearActionType,
  HmsRedoActionType,
  HmsUndoActionType,
  RootNodeUid,
} from '@_constants/main';
import { TNodeUid } from '@_node/types';
import {
  TFile,
  TFileAction,
} from '@_types/main';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

import {
  TMainReducerState,
  TUpdateTreeViewStatePayload,
} from './types';

// initial state of reducer
const initialState: TMainReducerState = {
  actionGroupIndex: 0,
  navigator: {
    workspace: {
      name: '',
      projects: [],
    },
    project: {
      context: 'local',
      files: {},
    },
    file: {
      uid: '',
      content: '',
    },
  },
  global: {
    fileAction: {
      type: null,
    }
  },
  fileTreeViewState: {
    focusedItem: RootNodeUid,
    expandedItems: [RootNodeUid],
    expandedItemsObj: { [RootNodeUid]: true },
    selectedItems: [],
    selectedItemsObj: {},
  },
  nodeTreeViewState: {
    focusedItem: RootNodeUid,
    expandedItems: [RootNodeUid],
    expandedItemsObj: { [RootNodeUid]: true },
    selectedItems: [],
    selectedItemsObj: {},
  },
}

// create the slice
const slice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    increaseActionGroupIndex(state, action: PayloadAction) {
      state.actionGroupIndex++
    },
    clearMainState(state, action: PayloadAction) {
      state.actionGroupIndex = initialState.actionGroupIndex
      state.navigator = initialState.navigator
      state.global = initialState.global
      state.fileTreeViewState = initialState.fileTreeViewState
      state.nodeTreeViewState = initialState.nodeTreeViewState
    },

    // navigator
    setCurrentFile(state, action: PayloadAction<TFile>) {
      const payload = action.payload
      state.navigator.file = payload
    },
    removeCurrentFile(state, action: PayloadAction) {
      state.navigator.file = initialState.navigator.file
    },
    setCurrentFileContent(state, action: PayloadAction<string>) {
      const data = action.payload
      state.navigator.file.content = data
    },

    // global
    setFileAction(state, action: PayloadAction<TFileAction>) {
      const payload = action.payload
      state.global.fileAction = payload
    },

    // node tree view state
    clearFNState(state, action: PayloadAction) {
      state.nodeTreeViewState = initialState.nodeTreeViewState
    },
    focusFNNode(state, action: PayloadAction<TNodeUid>) {
      const uid = action.payload
      state.nodeTreeViewState.focusedItem = uid
    },
    expandFNNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.nodeTreeViewState.expandedItemsObj[uid] = true
      }
      state.nodeTreeViewState.expandedItems = Object.keys(state.nodeTreeViewState.expandedItemsObj)
    },
    collapseFNNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.nodeTreeViewState.expandedItemsObj[uid]
      }
      state.nodeTreeViewState.expandedItems = Object.keys(state.nodeTreeViewState.expandedItemsObj)
    },
    selectFNNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      state.nodeTreeViewState.selectedItems = uids
      state.nodeTreeViewState.selectedItemsObj = {}
      for (const uid of uids) {
        state.nodeTreeViewState.selectedItemsObj[uid] = true
      }
    },
    updateFNTreeViewState(state, action: PayloadAction<TUpdateTreeViewStatePayload>) {
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        deletedUids.map((uid) => {
          if (state.nodeTreeViewState.focusedItem === uid) {
            state.nodeTreeViewState.focusedItem = ''
          }
          delete state.nodeTreeViewState.expandedItemsObj[uid]
          delete state.nodeTreeViewState.selectedItemsObj[uid]
        })
      }
      if (convertedUids) {
        let f_uid: TNodeUid = ''
        const e_deletedUids: TNodeUid[] = [], e_addedUids: TNodeUid[] = []
        const s_deletedUids: TNodeUid[] = [], s_addedUids: TNodeUid[] = []

        for (const [prev, cur] of convertedUids) {
          if (state.nodeTreeViewState.focusedItem === prev) {
            f_uid = cur
          }
          if (state.nodeTreeViewState.expandedItemsObj[prev]) {
            e_deletedUids.push(prev)
            e_addedUids.push(cur)
          }
          if (state.nodeTreeViewState.selectedItemsObj[prev]) {
            s_deletedUids.push(prev)
            s_addedUids.push(cur)
          }
        }

        state.nodeTreeViewState.focusedItem = f_uid !== '' ? f_uid : state.nodeTreeViewState.focusedItem
        e_deletedUids.map((_deletedUid) => {
          delete state.nodeTreeViewState.expandedItemsObj[_deletedUid]
        })
        e_addedUids.map((_addedUid) => {
          state.nodeTreeViewState.expandedItemsObj[_addedUid] = true
        })
        s_deletedUids.map((_deletedUid) => {
          delete state.nodeTreeViewState.selectedItemsObj[_deletedUid]
        })
        s_addedUids.map((_addedUid) => {
          state.nodeTreeViewState.selectedItemsObj[_addedUid] = true
        })
      }

      state.nodeTreeViewState.expandedItems = Object.keys(state.nodeTreeViewState.expandedItemsObj)
      state.nodeTreeViewState.selectedItems = Object.keys(state.nodeTreeViewState.selectedItemsObj)
    },

    // file tree view state
    focusFFNode(state, action: PayloadAction<TNodeUid>) {
      const uid = action.payload
      state.fileTreeViewState.focusedItem = uid
    },
    expandFFNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        state.fileTreeViewState.expandedItemsObj[uid] = true
      }
      state.fileTreeViewState.expandedItems = Object.keys(state.fileTreeViewState.expandedItemsObj)
    },
    collapseFFNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      for (const uid of uids) {
        delete state.fileTreeViewState.expandedItemsObj[uid]
      }
      state.fileTreeViewState.expandedItems = Object.keys(state.fileTreeViewState.expandedItemsObj)
    },
    selectFFNode(state, action: PayloadAction<TNodeUid[]>) {
      const uids = action.payload
      state.fileTreeViewState.selectedItems = uids
      state.fileTreeViewState.selectedItemsObj = {}
      for (const uid of uids) {
        state.fileTreeViewState.selectedItemsObj[uid] = true
      }
    },
    updateFFTreeViewState(state, action: PayloadAction<TUpdateTreeViewStatePayload>) {
      const { deletedUids, convertedUids } = action.payload
      if (deletedUids) {
        for (const uid of deletedUids) {
          if (state.fileTreeViewState.focusedItem === uid) {
            state.fileTreeViewState.focusedItem = ''
          }
          delete state.fileTreeViewState.expandedItemsObj[uid]
          delete state.fileTreeViewState.selectedItemsObj[uid]
        }
      }
      if (convertedUids) {
        for (const [prev, cur] of convertedUids) {
          if (state.fileTreeViewState.expandedItemsObj[prev]) {
            delete state.fileTreeViewState.expandedItemsObj[prev]
            state.fileTreeViewState.expandedItemsObj[cur] = true
          }
          if (state.fileTreeViewState.selectedItemsObj[prev]) {
            delete state.fileTreeViewState.selectedItemsObj[prev]
            state.fileTreeViewState.selectedItemsObj[cur] = true
          }
        }
      }
      state.fileTreeViewState.expandedItems = Object.keys(state.fileTreeViewState.expandedItemsObj)
      state.fileTreeViewState.selectedItems = Object.keys(state.fileTreeViewState.selectedItemsObj)
    },
  },
})

// export the actions and reducer
export const {
  increaseActionGroupIndex,
  clearMainState,

  // navigator
  setCurrentFile,
  removeCurrentFile,
  setCurrentFileContent,

  // global
  setFileAction,

  // node tree view state
  clearFNState,
  focusFNNode,
  expandFNNode,
  collapseFNNode,
  selectFNNode,
  updateFNTreeViewState,

  // file tree  view state
  focusFFNode,
  expandFFNode,
  collapseFFNode,
  selectFFNode,
  updateFFTreeViewState,
} = slice.actions

export const MainReducer = undoable(slice.reducer, {
  filter: function filterActions(action, currentState, previousHistory) {
    return action.type === 'main/updateFFTreeViewState' ? false : true
  },
  groupBy: (action, currentState, previousHistory) => {
    return action.type === 'main/increaseActionGroupIndex' ? currentState.actionGroupIndex - 1 : currentState.actionGroupIndex
  },

  limit: HistoryStoreLimit,

  undoType: HmsUndoActionType,
  redoType: HmsRedoActionType,
  clearHistoryType: HmsClearActionType,
})