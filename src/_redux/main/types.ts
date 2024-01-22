import { MutableRefObject } from "react";

import { editor } from "monaco-editor";

import { TFileHandlerCollection } from "@_node/file";
import { TNodeUid } from "@_node/types";
import {
  TCmdkReferenceData,
  TFilesReferenceData,
  THtmlReferenceData,
} from "@_types/main";

import { TFileAction, TProjectContext } from "./fileTree";

export type TEventHistoryInfo = {
  future: number;
  past: number;
};

export type TTreeViewState = {
  focusedItem: TNodeUid;
  expandedItems: TNodeUid[];
  expandedItemsObj: {
    [uid: TNodeUid]: true;
  };
  selectedItems: TNodeUid[];
  selectedItemsObj: {
    [uid: TNodeUid]: true;
  };
};
export type TUpdateTreeViewStatePayload = {
  deletedUids?: TNodeUid[];
  convertedUids?: [TNodeUid, TNodeUid][];
};

export type TMainContext = {
  addRunningActions: (actionNames: string[]) => void;
  removeRunningActions: (actionNames: string[]) => void;

  filesReferenceData: TFilesReferenceData;
  htmlReferenceData: THtmlReferenceData;
  cmdkReferenceData: TCmdkReferenceData;

  projectHandlers: TFileHandlerCollection;
  setProjectHandlers: (projectHandlerObj: TFileHandlerCollection) => void;
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  setCurrentProjectFileHandle: (
    fileHandler: FileSystemDirectoryHandle | null,
  ) => void;
  fileHandlers: TFileHandlerCollection;
  setFileHandlers: (fileHandlerObj: TFileHandlerCollection) => void;

  recentProjectNames: string[];
  recentProjectHandlers: (FileSystemDirectoryHandle | null)[];
  recentProjectContexts: TProjectContext[];

  monacoEditorRef: IEditorRef;
  setMonacoEditorRef: (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => void;
  iframeRefRef: MutableRefObject<HTMLIFrameElement | null>;
  setIframeRefRef: (iframeRef: HTMLIFrameElement | null) => void;
  isContentProgrammaticallyChanged: React.RefObject<boolean>;
  setIsContentProgrammaticallyChanged: (value: boolean) => void;
  isCodeTyping: React.RefObject<boolean>;
  setIsCodeTyping: (value: boolean) => void;

  invalidFileNodes: {
    [uid: TNodeUid]: true;
  };
  addInvalidFileNodes: (...uids: TNodeUid[]) => void;
  removeInvalidFileNodes: (...uids: TNodeUid[]) => void;

  importProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemDirectoryHandle | null,
    fromURL?: boolean,
  ) => void;
  reloadCurrentProject: (action?: TFileAction) => void;
  triggerCurrentProjectReload: () => void;

  onUndo: () => void;
  onRedo: () => void;
};

export type IEditorRef = React.RefObject<editor.IStandaloneCodeEditor | null>;
