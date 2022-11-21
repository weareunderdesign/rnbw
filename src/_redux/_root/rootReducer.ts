import { FFReducer } from '@_redux/ff';
import { FNReducer } from '@_redux/fn';
import { GlobalReducer } from '@_redux/global';
import { combineReducers } from '@reduxjs/toolkit';

// Seperate Reducers
const global = { global: GlobalReducer }
const ff = { ff: FFReducer }
const fn = { fn: FNReducer }

// Combile all of the Reducers and Create the Root Reducer
let rootReducer = combineReducers({
  ...global,
  ...ff,
  ...fn,
})
export default function createReducer(injectedReducers = {}) {
  rootReducer = combineReducers({
    ...global,
    ...ff,
    ...fn,
    ...injectedReducers,
  });
  return rootReducer;
}

// Root State
export type AppState = ReturnType<typeof rootReducer>