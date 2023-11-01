import { combineReducers } from "@reduxjs/toolkit";

import { CmdkReduer } from "./cmdk";
import { CodeViewReduer } from "./codeView";
import { FileTreeReducer } from "./fileTree";
import { FileEventReducer } from "./fileTree/event";
import { NodeTreeReducer } from "./nodeTree";
import { NodeEventReducer } from "./nodeTree/event";
import { ProcessorReduer } from "./processor";
import { StageViewReducer } from "./stageView";

export const MainReducer = combineReducers({
  processor: ProcessorReduer,

  cmdk: CmdkReduer,

  fileTree: FileTreeReducer,
  fileEvent: FileEventReducer,

  nodeTree: NodeTreeReducer,
  nodeEvent: NodeEventReducer,

  codeView: CodeViewReduer,

  stageView: StageViewReducer,
});
