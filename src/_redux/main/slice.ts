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

export const MainReducer = combineReducers({
  reference: ReferenceReducer,
  project: ProjectReducer,
  processor: ProcessorReduer,

  cmdk: CmdkReduer,

  fileTree: FileTreeReducer,
  fileEvent: FileEventReducer,

  nodeTree: NodeTreeReducer,
  nodeEvent: NodeEventReducer,

  codeView: CodeViewReduer,

  stageView: StageViewReducer,
});
