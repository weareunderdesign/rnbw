import { combineReducers } from "@reduxjs/toolkit";

import { CmdkReducer } from "./cmdk";
import { CodeViewReducer } from "./codeView";
import { FileTreeReducer } from "./fileTree";
import { FileEventReducer } from "./fileTree/event";
import { NodeTreeReducer } from "./nodeTree";
import { NodeEventReducer } from "./nodeTree/event";
import { ProcessorReduer } from "./processor";
import { ReferenceReducer } from "./reference";
import { ProjectReducer } from "./project";

import { persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/es/storage/createWebStorage";
import { DesignViewReducer } from "./designView";

import editorReducer from "./editorSlice";

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
const storage =
  typeof window !== "undefined"
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

  cmdk: CmdkReducer,

  file: FileTreeReducer,
  fileEvent: FileEventReducer,

  nodeTree: NodeTreeReducer,
  nodeEvent: NodeEventReducer,

  codeView: CodeViewReducer,
  editor: editorReducer,

  designView: DesignViewReducer,
});
