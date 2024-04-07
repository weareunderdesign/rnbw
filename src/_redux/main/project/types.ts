import { TNodeUid } from "@_node/types";
import { TProjectContext } from "../fileTree";

export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};
export type TProjectReducerState = {
  projectHandlers: TFileHandlerCollection;
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  fileHandlers: TFileHandlerCollection;
  recentProjects: TRecentProjects;
};

export type TRecentProjects = {
  names: string[];
  handlers: (FileSystemDirectoryHandle | null)[];
  contexts: TProjectContext[];
};
