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
    addFFNode(state, action: PayloadAction<FFNode[]>) {
      const nodes = action.payload
      for (const node of nodes) {
        state.workspace[node.uid] = node
      }
    },
    closeFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      const uid: TUid = uids.shift() as TUid
      state.workspace[uid].children = []
      for (const uid of uids) {
        delete state.workspace[uid]
      }
    },
    setCurrentFile(state, action: PayloadAction<{
      uid: TUid, type: TFileType, content: string,
    }>) {
      const payload = action.payload
      state.currentFile = payload
    },
    updateFileContent(state, action: PayloadAction<string>) {
      const data = action.payload
      state.currentFile.content = data
    },
    setGlobalPending(state, action: PayloadAction<boolean>) {
      state.pending = action.payload
    },
    setGlobalError(state, action: PayloadAction<string>) {
      const error = action.payload
      console.log(error)
      state.error = error
    },
  },
})

// export the actions and reducer
export const { addFFNode, closeFFNode, setCurrentFile, updateFileContent, setGlobalPending, setGlobalError } = slice.actions
export const GlobalReducer = slice.reducer