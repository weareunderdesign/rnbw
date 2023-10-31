import { GlobalReducer } from "@_redux/global";
import { MainReducer } from "@_redux/main";
import { combineReducers } from "@reduxjs/toolkit";

const global = { global: GlobalReducer };
const main = { main: MainReducer };

const rootReducer = combineReducers({
  ...global,
  ...main,
});

export default function createReducer(injectedReducers = {}) {
  const rootReducer = combineReducers({
    ...global,
    ...main,
    ...injectedReducers,
  });
  return rootReducer;
}

export type AppState = ReturnType<typeof rootReducer>;
