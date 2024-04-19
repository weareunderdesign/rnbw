import { TNodeUid } from "@_node/types";
import { TProjectContext } from "../fileTree";

export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};
export type TProjectReducerState = {
  projectHandlers: TFileHandlerCollection;
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  fileHandlers: TFileHandlerCollection;
  recentProject: TRecentProject[];
};

export type TRecentProject = {
  name: string;
  handler: FileSystemDirectoryHandle | null;
  context: TProjectContext;
};
