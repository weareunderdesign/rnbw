import { combineReducers } from "@reduxjs/toolkit";

import { CmdkReducer } from "./cmdk";
import { CodeViewReducer } from "./codeView";
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

  cmdk: CmdkReducer,

  fileTree: FileTreeReducer,
  fileEvent: FileEventReducer,

  nodeTree: NodeTreeReducer,
  nodeEvent: NodeEventReducer,

  codeView: CodeViewReducer,

  stageView: StageViewReducer,
});
