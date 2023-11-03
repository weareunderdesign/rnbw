import { editor } from "monaco-editor";

import { TFileHandlerCollection, TFilesReferenceData } from "@_node/file";
import { THtmlReferenceData } from "@_node/html";
import { TNodeUid } from "@_node/types";
import { TCmdkReferenceData, TCodeChange } from "@_types/main";

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

  currentProjectFileHandler: FileSystemDirectoryHandle | null;
  setCurrentProjectFileHandler: (
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

  // references

  loadProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemHandle | null,
    internal?: boolean | true,
  ) => void;
  closeAllPanel: () => void;

  // non-html editable
  parseFileFlag: boolean;
  setParseFile: (parseFile: boolean) => void;
  prevFileUid: string;
  setPrevFileUid: (uid: string) => void;
};

export type IEditorRef = React.RefObject<editor.IStandaloneCodeEditor | null>;
