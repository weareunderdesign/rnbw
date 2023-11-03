import { Context, createContext } from "react";

import { TMainContext } from "./types";

export const MainContext: Context<TMainContext> = createContext<TMainContext>({
  addRunningActions: () => {},
  removeRunningActions: () => {},

  filesReferenceData: {},
  htmlReferenceData: {
    elements: {},
  },
  cmdkReferenceData: {},

  currentProjectFileHandle: null,
  setCurrentProjectFileHandle: () => {},

  fileHandlers: {},
  setFileHandlers: () => {},

  monacoEditorRef: { current: null },
  setMonacoEditorRef: () => {},

  // code view
  isContentProgrammaticallyChanged: {
    current: false,
  },
  setIsContentProgrammaticallyChanged: () => {},
  codeChanges: [],
  setCodeChanges: () => {},
  newFocusedNodeUid: "",
  setNewFocusedNodeUid: () => {},
  setCodeViewOffsetTop: () => {},

  // load project
  loadProject: () => {},

  // close all panel
  closeAllPanel: () => {},
  // non-parse file
  parseFileFlag: true,
  setParseFile: () => {},
  prevFileUid: "",
  setPrevFileUid: () => {},
});
