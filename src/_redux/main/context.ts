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

  iframeRefRef: { current: null },
  setIframeRefRef: () => {},

  // code view
  isContentProgrammaticallyChanged: {
    current: false,
  },
  setIsContentProgrammaticallyChanged: () => {},

  setCodeViewOffsetTop: () => {},

  // import project
  importProject: () => {},

  // close all panel
  closeAllPanel: () => {},

  //undo/redo
  onUndo: () => {},
  onRedo: () => {},
});
