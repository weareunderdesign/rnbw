import { FFReducer } from '@_redux/ff';
import { FNReducer } from '@_redux/fn';
import { GlobalReducer } from '@_redux/global';
import { SocketReducer } from '@_redux/socket';
import { TemplateReducer } from '@_redux/template';
import { combineReducers } from '@reduxjs/toolkit';

// Seperate Reducers
const socket = { socket: SocketReducer }
const global = { global: GlobalReducer }
const ff = { ff: FFReducer }
const fn = { fn: FNReducer }
const template = { template: TemplateReducer }

// Combile all of the Reducers and Create the Root Reducer
let rootReducer = combineReducers({
  ...socket,
  ...global,
  ...ff,
  ...fn,
  ...template,
})
export default function createReducer(injectedReducers = {}) {
  rootReducer = combineReducers({
    ...socket,
    ...global,
    ...ff,
    ...fn,
    ...template,
    ...injectedReducers,
  });
  return rootReducer;
}

// Root State
export type AppState = ReturnType<typeof rootReducer>