import { combineReducers } from "@reduxjs/toolkit";

import { CmdkReduer } from "./cmdk";
import { CodeViewReduer } from "./codeView";
import { FileTreeReducer } from "./fileTree";
import { FileTreeEventReducer } from "./fileTree/event";
import { NodeTreeReducer } from "./nodeTree";
import { NodeTreeEventReducer } from "./nodeTree/event";
import { ProcessorReduer } from "./processor";
import { StageViewReducer } from "./stageView";

export const MainReducer = combineReducers({
  processor: ProcessorReduer,

  cmdk: CmdkReduer,

  fileTree: FileTreeReducer,
  fileTreeEvent: FileTreeEventReducer,

  nodeTree: NodeTreeReducer,
  nodeTreeEvent: NodeTreeEventReducer,

  codeView: CodeViewReduer,

  stageView: StageViewReducer,
});
