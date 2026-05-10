import { TFileNodeTreeData } from "@_api/index";
import { TNodeUid } from "@_api/types";

import { TTreeViewState } from "../types";
import { TFileAction } from "./event";

export type TFileTreeReducerState = {
  workspace: TWorkspace;
  project: Omit<TProject, "handler">;
  fileTree: TFileNodeTreeData;
  initialFileUidToOpen: TNodeUid;
  prevFileUid: TNodeUid;
  currentFileUid: TNodeUid;
  renderableFileUid: TNodeUid;

  fileTreeViewState: TTreeViewState;
  hoveredFileUid: TNodeUid;

  doingFileAction: boolean;
  lastFileAction: TFileAction;
  invalidFileNodes: {
    [uid: TNodeUid]: true;
  };
};

export type TWorkspace = {
  name: string;
  projects: Omit<TProject, "handler">[];
};

export type TProject = {
  context: TProjectContext;
  name: string;
  handler: FileSystemDirectoryHandle | null;
  favicon: string | null;
};
export type TProjectContext = "local" | "idb";
