import { MainReducer } from '@_redux/main';
import { combineReducers } from '@reduxjs/toolkit';

// Seperate Reducers
const main = { main: MainReducer }

// Combile all of the Reducers and Create the Root Reducer
let rootReducer = combineReducers({
  ...main,
})
export default function createReducer(injectedReducers = {}) {
  rootReducer = combineReducers({
    ...main,
    ...injectedReducers,
  })
  return rootReducer
}

// Root State
export type AppState = ReturnType<typeof rootReducer>