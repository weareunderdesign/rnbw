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
  error: '',
}

// create the slice
const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    addFFNode(state, action: PayloadAction<FFNode[]>) {
      let nodes = action.payload
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
    addWatchedFFObject(state, action: PayloadAction<FFNode>) {
      /* const ffNode: FFNode = action.payload

      let found: boolean = false */
      // check the parent
      /*  for (const uid in state.workspace) {
         const ffObject = state.workspace[uid]
         const ffObjectFullPath = getFullPath(ffObject)
         if (ffObjectFullPath === ffNode.path) {
           found = true
           ffNode.p_uid = ffObject.uid
           ffObject.children.push(ffNode.uid)
           break;
         }
       }
       if (!found) {
         for (const uid in state.projects) {
           const ffObject = state.projects[uid]
           const ffObjectFullPath = getFullPath(ffObject)
           if (ffObjectFullPath === ffNode.path) {
             found = true
             ffNode.p_uid = ffObject.uid
             ffObject.children.push(ffNode.uid)
             break;
           }
         }
       } */

      // add to the projects state
      /* state.workspace[ffNode.uid] = ffNode */
    },
    removeWatchedFFObject(state, action: PayloadAction<FFNode>) {
      /* const ffNode: FFNode = action.payload
      const fullPath = getFullPath(ffNode)

      let found: boolean = false
      // check the parent
      for (const uid in state.workspace) {
        const ffObject = state.workspace[uid]
        const ffObjectFullPath = getFullPath(ffObject)
        if (ffObjectFullPath === fullPath) {
          found = true
          ffNode.uid = ffObject.uid
          break;
        }
      }
      if (!found) {
        for (const uid in state.projects) {
          const ffObject = state.projects[uid]
          const ffObjectFullPath = getFullPath(ffObject)
          if (ffObjectFullPath === fullPath) {
            found = true
            ffNode.uid = ffObject.uid
            break;
          }
        }
      }

      // remove
      if (found) {
        const removeTree = (uid: UID) => {
          const ffNode = state.workspace[uid] || state.projects[uid]
          if (ffNode === undefined) {
            return
          }

          // check the parent
          if (ffNode.p_uid !== null) {
            const parent = state.workspace[ffNode.p_uid] || state.projects[ffNode.p_uid]
            if (parent !== undefined) {
              parent.children = parent.children.filter((childUID: UID) => childUID !== uid)
            }
          }

          // remove the current and its children
          const removeUIDs = [uid]
          while (removeUIDs.length) {
            const removeUID: UID = removeUIDs.shift() as string
            const ffNode: FFObject = state.workspace[removeUID] || state.projects[removeUID]
            if (ffNode === undefined) {
              continue
            }
            removeUIDs.push(...ffNode.children)
            delete state.workspace[removeUID]
            delete state.projects[removeUID]
          }
        }

        removeTree(ffNode.uid)
      } */
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
    setGlobalError(state, action: PayloadAction<string>) {
      const error = action.payload
      state.error = error
    },
  },
})

// export the actions and reducer
export const { addFFNode, removeFFNode, closeFFNode, addWatchedFFObject, removeWatchedFFObject, renameFFNode, setCurrentFile, setGlobalError } = slice.actions
export const GlobalReducer = slice.reducer