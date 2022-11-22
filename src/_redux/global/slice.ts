import { TUid } from '@_node/types';
import {
  FFNode,
  FFNodeActionReadPayloadRes,
  FFNodeActionRenamePayloadRes,
  FFNodeActionUpdatePayloadRes,
} from '@_types/ff';
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
    removeFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      if (uids.length === 0) {
        return
      }
      const removeNode = state.workspace[uids[0]]
      if (removeNode.p_uid) {
        state.workspace[removeNode.p_uid].children = state.workspace[removeNode.p_uid].children.filter(childUid => childUid !== removeNode.uid)
      }
      for (const uid of uids) {
        delete state.workspace[uid]
      }
    },
    closeFFNode(state, action: PayloadAction<TUid[]>) {
      const uids = action.payload
      if (uids.length === 0) {
        return
      }
      const uid = uids.shift() as TUid
      state.workspace[uid].children = []
      for (const uid of uids) {
        delete state.workspace[uid]
      }
    },
    addWatchedFFNode(state, action: PayloadAction<FFNode>) {
      const node = action.payload
      if (state.workspace[node.p_uid as string] === undefined) {
        node.p_uid = null
      } else {
        const p_node = state.workspace[node.p_uid as string]
        let added: boolean = false
        p_node.children = p_node.children.reduce((prev: TUid[], cur: TUid): TUid[] => {
          const curNode: FFNode = state.workspace[cur]
          !added && ((curNode.isEntity && !node.isEntity) || (curNode.isEntity === node.isEntity && curNode.name > node.name)) ? [added = true, prev.push(node.uid, cur)] : prev.push(cur)
          return prev
        }, [])
        if (!added) {
          p_node.children.push(node.uid)
        }
      }
      state.workspace[node.uid] = node
    },
    renameFFNode(state, action: PayloadAction<FFNodeActionRenamePayloadRes>) {
      const { nodes, name } = action.payload
      if (nodes.length === 0) {
        return
      }
      for (const node of nodes) {
        delete state.workspace[node.data]
        state.workspace[node.uid] = node
      }
      const renameNode = nodes[0]
      if (renameNode.p_uid) {
        state.workspace[renameNode.p_uid].children = state.workspace[renameNode.p_uid].children.map(childUid => childUid === renameNode.data ? renameNode.uid : childUid)
      }
    },
    setCurrentFile(state, action: PayloadAction<FFNodeActionReadPayloadRes | FFNodeActionUpdatePayloadRes>) {
      const payload = action.payload
      state.currentFile = payload
    },
    updateFileContent(state, action: PayloadAction<string>) {
      const data = action.payload
      state.currentFile.content = data
    },
    setGlobalError(state, action: PayloadAction<string>) {
      const error = action.payload
      state.error = error
    },
    setGlobalPending(state, action: PayloadAction<boolean>) {
      state.pending = action.payload
    }
  },
})

// export the actions and reducer
export const { addFFNode, removeFFNode, closeFFNode, addWatchedFFNode, renameFFNode, setCurrentFile, setGlobalError, updateFileContent, setGlobalPending } = slice.actions
export const GlobalReducer = slice.reducer