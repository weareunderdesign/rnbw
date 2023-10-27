import { Context, createContext } from "react";

import { editor } from "monaco-editor";

import { DefaultTabSize } from "@_constants/main";
import { TFileHandlerCollection } from "@_node/file";
import { TNodeUid } from "@_node/types";
import { TToast } from "@_types/global";
import { TCodeChange } from "@_types/main";

import { TProjectContext } from "./fileTree";
import { IEditorRef, TMainContext } from "./types";

export const MainContext: Context<TMainContext> = createContext<TMainContext>({
  // file tree
  ffHandlers: {},
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => {},

  // code view
  isContentProgrammaticallyChanged: {
    current: false,
  },
  setIsContentProgrammaticallyChanged: (changed: boolean) => {},
  codeChanges: [],
  setCodeChanges: (changes: TCodeChange[]) => {},
  tabSize: DefaultTabSize,
  setTabSize: (size: number) => {},
  newFocusedNodeUid: "",
  setNewFocusedNodeUid: (uid: TNodeUid) => {},
  setCodeViewOffsetTop: (offsetTop: string) => {},

  // references
  filesReferenceData: {},
  htmlReferenceData: {
    elements: {},
  },
  cmdkReferenceData: {},

  // toasts
  addMessage: (message: TToast) => {},
  removeMessage: (index: number) => {},
  // load project
  loadProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemHandle | null,
    internal?: boolean,
  ) => {},

  // close all panel
  closeAllPanel: () => {},
  // non-parse file
  parseFileFlag: true,
  setParseFile: (parseFile: boolean) => {},
  prevFileUid: "",
  setPrevFileUid: (uid: string) => {},
  monacoEditorRef: { current: null } as IEditorRef,
  setMonacoEditorRef: (editor: editor.IStandaloneCodeEditor | null) => {},
});
