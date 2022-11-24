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
    console.log(currentState.fn.selectedItems, previousHistory.index)
    // excludeAction(["global/setGlobalPending", "global/setGlobalError"])
    return action.type !== "global/setGlobalPending" // only add to history if action is SOME_ACTION
  },
  groupBy: groupByActionTypes([]),
})
export default function createReducer(injectedReducers = {}) {
  rootReducer = undoable(combineReducers({
    ...global,
    ...ff,
    ...fn,
    ...injectedReducers,
  }), {
    filter: function filterActions(action, currentState, previousHistory) {
      // console.log(currentState.fn.selectedItems, previousHistory.index)
      // excludeAction(["global/setGlobalPending", "global/setGlobalError"])
      return action.type !== "global/setGlobalPending" // only add to history if action is SOME_ACTION
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