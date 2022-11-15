import { getFullPath } from '@_back/services';
import {
  FFNodeActionRenamePayloadRes,
  FFObject,
  Project,
} from '@gtypes/ff';
import {
  ErrorRes,
  UID,
} from '@gtypes/global';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.GlobalState = {
  workspace: {},
  projects: {},
  currentFile: {
    uid: '',
    type: 'unknown',
    content: '',
  },
  error: {
    errorMessage: '',
  },
}

// create the slice
const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    addProject(state, action: PayloadAction<Types.AddProjectPayload>) {
      const project: Project = action.payload
      state.workspace[project.uid] = project
    },
    addFFObject(state, action: PayloadAction<Types.AddFFObjectPayload>) {
      let ffObjects: Types.AddFFObjectPayload = action.payload
      for (const ffObject of ffObjects) {
        if (ffObject.p_uid !== null) {
          state.projects[ffObject.uid] = ffObject
        } else {
          state.workspace[ffObject.uid] && (state.workspace[ffObject.uid] = ffObject)
          state.projects[ffObject.uid] && (state.projects[ffObject.uid] = ffObject)
        }
      }
    },
    removeFFObject(state, action: PayloadAction<Types.RemoveFFObjectPayload>) {
      const uids = action.payload

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

      for (const uid of uids) {
        removeTree(uid)
      }
    },
    addWatchedFFObject(state, action: PayloadAction<FFObject>) {
      const ffNode: FFObject = action.payload

      let found: boolean = false
      // check the parent
      for (const uid in state.workspace) {
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
      }

      // add to the projects state
      state.projects[ffNode.uid] = ffNode
    },
    removeWatchedFFObject(state, action: PayloadAction<FFObject>) {
      const ffNode: FFObject = action.payload
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
      }
    },
    renameFFNode(state, action: PayloadAction<FFNodeActionRenamePayloadRes>) {
      const { uid, name } = action.payload
      const ffNode = state.workspace[uid] || state.projects[uid]
      if (ffNode === undefined) {
        return
      }
      ffNode.name = name
    },
    setCurrentFile(state, action: PayloadAction<Types.SetCurrentFilePayload>) {
      const payload: Types.SetCurrentFilePayload = action.payload
      state.currentFile = payload
    },
    setGlobalError(state, action: PayloadAction<ErrorRes>) {
      const error = action.payload
      state.error = error
    }
  },
})

// export the actions and reducer
export const { addProject, addFFObject, removeFFObject, addWatchedFFObject, removeWatchedFFObject, renameFFNode, setCurrentFile, setGlobalError } = slice.actions
export const GlobalReducer = slice.reducer