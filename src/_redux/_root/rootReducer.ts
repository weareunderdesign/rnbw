import { GlobalReducer } from "@_redux/global";
import { FileTreeReducer, NodeTreeReducer } from "@_redux/main";
import { combineReducers } from "@reduxjs/toolkit";

const global = { global: GlobalReducer };
const main = { fileTree: FileTreeReducer, nodeTree: NodeTreeReducer };

let rootReducer = combineReducers({
  ...global,
  ...main,
});

export default function createReducer(injectedReducers = {}) {
  rootReducer = combineReducers({
    ...global,
    ...main,
    ...injectedReducers,
  });
  return rootReducer;
}

export type AppState = ReturnType<typeof rootReducer>;
