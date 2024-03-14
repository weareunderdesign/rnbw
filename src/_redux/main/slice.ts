import { combineReducers } from "@reduxjs/toolkit";

import { CmdkReduer } from "./cmdk";
import { CodeViewReduer } from "./codeView";
import { FileTreeReducer } from "./fileTree";
import { FileEventReducer } from "./fileTree/event";
import { NodeTreeReducer } from "./nodeTree";
import { NodeEventReducer } from "./nodeTree/event";
import { ProcessorReduer } from "./processor";
import { ReferenceReducer } from "./reference";
import { StageViewReducer } from "./stageView";
import { ProjectReducer } from "./project";

import { persistReducer } from "redux-persist";
import persistStore from "redux-persist/es/persistStore";
import createWebStorage from "redux-persist/es/storage/createWebStorage";

export function createPersistStore() {
  const isServer = typeof window === "undefined";
  if (isServer) {
    return {
      getItem() {
        return Promise.resolve(null);
      },
      setItem() {
        return Promise.resolve();
      },
      removeItem() {
        return Promise.resolve();
      },
    };
  }
  return createWebStorage("local");
}
const storage = typeof window !== "undefined"
    ? createWebStorage("local")
    : createPersistStore();

const processorPersistConfig = {
  key: "processor",
  storage: storage,
  whitelist: ["autoSave", "formatCode"],
};

export const MainReducer = combineReducers({
  reference: ReferenceReducer,
  project: ProjectReducer,
  processor: persistReducer(processorPersistConfig, ProcessorReduer),

  cmdk: CmdkReduer,

  fileTree: FileTreeReducer,
  fileEvent: FileEventReducer,

  nodeTree: NodeTreeReducer,
  nodeEvent: NodeEventReducer,

  codeView: CodeViewReduer,

  stageView: StageViewReducer,
});
