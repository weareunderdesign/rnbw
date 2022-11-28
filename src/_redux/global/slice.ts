import {
  TFileType,
  TUid,
} from '@_node/types';
import { FFNode } from '@_types/ff';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.GlobalState = {
  workspace: {},
  currentFile: {
    uid: '',
    type: 'unknown',
    content: '',
  },
  pending: false,
  error: '',
}

// create the slice
const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    clearGlobalState(state, action: PayloadAction) {
      console.log(action)
      state.workspace = initialState.workspace
      state.currentFile = initialState.currentFile
      state.pending = initialState.pending
      state.error = initialState.error
    },
    addFFNode(state, action: PayloadAction<FFNode[]>) {
      console.log(action)
      const nodes = action.payload
      for (const node of nodes) {
        state.workspace[node.uid] = node
      }
    },
    removeFFNode(state, action: PayloadAction<TUid[]>) {
      console.log(action)
      const uids = action.payload
      for (const uid of uids) {
        delete state.workspace[uid]
      }
    },
    setCurrentFile(state, action: PayloadAction<{
      uid: TUid, type: TFileType, content: string,
    }>) {
      console.log(action)
      const payload = action.payload
      state.currentFile = payload
    },
    updateFileContent(state, action: PayloadAction<string>) {
      console.log(action)
      const data = action.payload
      state.currentFile.content = data
    },
    setGlobalPending(state, action: PayloadAction<boolean>) {
      console.log(action)
      state.pending = action.payload
    },
    setGlobalError(state, action: PayloadAction<string>) {
      console.log(action)
      const error = action.payload
      state.error = error
    },
  },
})

// export the actions and reducer
export const { clearGlobalState, addFFNode, removeFFNode, setCurrentFile, updateFileContent, setGlobalPending, setGlobalError } = slice.actions
export const GlobalReducer = slice.reducer