import undoable, { groupByActionTypes } from 'redux-undo';

import { FFReducer } from '@_redux/ff';
import { FNReducer } from '@_redux/fn';
import { GlobalReducer } from '@_redux/global';
import { combineReducers } from '@reduxjs/toolkit';

// Seperate Reducers
const global = { global: GlobalReducer }
const ff = { ff: FFReducer }
const fn = { fn: FNReducer }

// Combile all of the Reducers and Create the Root Reducer
let rootReducer = undoable(combineReducers({
  ...global,
  ...ff,
  ...fn,
}), {
  filter: function filterActions(action, currentState, previousHistory) {
    /* remove spinner action - global/setGlobalPending action */
    return action.type !== "global/setGlobalPending"
  },
  groupBy: (action, currentState, previousHistory) => {

  },
  limit: 10000,
})
export default function createReducer(injectedReducers = {}) {
  rootReducer = undoable(combineReducers({
    ...global,
    ...ff,
    ...fn,
    ...injectedReducers,
  }), {
    filter: function filterActions(action, currentState, previousHistory) {
      /* remove spinner action - global/setGlobalPending action */
      return action.type !== "global/setGlobalPending"
    },
    groupBy: groupByActionTypes([]),
  })
  return rootReducer
}

// Root State
export type AppState = ReturnType<typeof rootReducer>

/* 
import undoable, {combineFilters} from 'redux-undo'
 
function isActionSelfExcluded(action) {
  return action.wouldLikeToBeInHistory
}
 
function areWeRecording(action, state) {
  return state.recording
}
 
undoable(reducer, {
  filter: combineFilters(isActionSelfExcluded, areWeRecording)
})
*/