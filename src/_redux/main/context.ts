import { Context, createContext } from "react";

import { TMainContext } from "./types";

export const MainContext: Context<TMainContext> = createContext<TMainContext>({
  maxNodeUidRef: { current: 0 },
  setMaxNodeUidRef: () => {},
  monacoEditorRef: { current: null },
  setMonacoEditorRef: () => {},
  iframeRefRef: { current: null },
  setIframeRefRef: () => {},

  importProject: () => {},
  reloadCurrentProject: () => {},

  onUndo: () => {},
  onRedo: () => {},
});
