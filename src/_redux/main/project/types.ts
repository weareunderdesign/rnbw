import { TNodeUid } from "@_node/types";
import { TProjectContext } from "../fileTree";

export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};
export type TProjectReducerState = {
  projectHandlers: TFileHandlerCollection;
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  fileHandlers: TFileHandlerCollection;
  recentProjectNames: string[];
  recentProjectHandlers: (FileSystemDirectoryHandle | null)[];
  recentProjectContexts: TProjectContext[];
};
