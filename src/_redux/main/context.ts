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

  projectHandlers: {},
  setProjectHandlers: () => {},
  currentProjectFileHandle: null,
  setCurrentProjectFileHandle: () => {},
  fileHandlers: {},
  setFileHandlers: () => {},

  recentProjectNames: [],
  recentProjectHandlers: [],
  recentProjectContexts: [],

  monacoEditorRef: { current: null },
  setMonacoEditorRef: () => {},
  iframeRefRef: { current: null },
  setIframeRefRef: () => {},
  isContentProgrammaticallyChanged: {
    current: false,
  },
  setIsContentProgrammaticallyChanged: () => {},
  isCodeTyping: {
    current: false,
  },
  setIsCodeTyping: () => {},

  invalidFileNodes: {},
  addInvalidFileNodes: () => {},
  removeInvalidFileNodes: () => {},

  importProject: () => {},
  reloadCurrentProject: () => {},
  triggerCurrentProjectReload: () => {},

  onUndo: () => {},
  onRedo: () => {},
});
