import { MutableRefObject } from "react";

import { editor } from "monaco-editor";

import { TNodeUid } from "@_node/types";

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

  monacoEditorRef: IEditorRef;
  setMonacoEditorRef: (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => void;
  iframeRefRef: MutableRefObject<HTMLIFrameElement | null>;
  setIframeRefRef: (iframeRef: HTMLIFrameElement | null) => void;

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
