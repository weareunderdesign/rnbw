import { editor } from "monaco-editor";

import { TFileHandlerCollection } from "@_node/file";
import { TNodeUid } from "@_node/types";
import {
  TCmdkReferenceData,
  TCodeChange,
  TFilesReferenceData,
  THtmlReferenceData,
} from "@_types/main";

import { TProjectContext } from "./fileTree";

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
  removeRunningActions: (actionNames: string[], effect?: boolean) => void;

  filesReferenceData: TFilesReferenceData;
  htmlReferenceData: THtmlReferenceData;
  cmdkReferenceData: TCmdkReferenceData;

  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  setCurrentProjectFileHandle: (
    fileHandler: FileSystemDirectoryHandle | null,
  ) => void;

  fileHandlers: TFileHandlerCollection;
  setFileHandlers: (fileHandlerObj: TFileHandlerCollection) => void;

  monacoEditorRef: IEditorRef;
  setMonacoEditorRef: (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => void;

  // code view
  isContentProgrammaticallyChanged: React.RefObject<boolean>;
  setIsContentProgrammaticallyChanged: (changed: boolean) => void;
  codeChanges: TCodeChange[];
  setCodeChanges: (changes: TCodeChange[]) => void;
  newFocusedNodeUid: TNodeUid;
  setNewFocusedNodeUid: (uid: TNodeUid) => void;
  setCodeViewOffsetTop: (offsetTop: string) => void;

  // import project
  importProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemDirectoryHandle | null,
  ) => void;
  closeAllPanel: () => void;

  // non-html editable
  parseFileFlag: boolean;
  setParseFile: (parseFile: boolean) => void;
  prevFileUid: string;
  setPrevFileUid: (uid: string) => void;
};

export type IEditorRef = React.RefObject<editor.IStandaloneCodeEditor | null>;
