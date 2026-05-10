import { MutableRefObject } from "react";
import { editor } from "monaco-editor";

import { TNodeUid, TValidNodeUid } from "@_api/types";

import { TFileAction, TProjectContext } from "./fileTree";

export type TEventHistoryInfo = {
  future: number;
  past: number;
};

export type TTreeViewState = {
  focusedItem: TNodeUid;
  expandedItemsObj: {
    [uid: TNodeUid]: true;
  };
  selectedItemsObj: {
    [uid: TNodeUid]: true;
  };
};
export type TUpdateTreeViewStatePayload = {
  deletedUids?: TNodeUid[];
  convertedUids?: [TNodeUid, TNodeUid][];
};

export type TMainContext = {
  maxNodeUidRef: MutableRefObject<TValidNodeUid>;
  setMaxNodeUidRef: (maxNodeUid: TValidNodeUid) => void;
  monacoEditorRef: IEditorRef;
  setMonacoEditorRef: (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => void;

  contentEditableUidRef: MutableRefObject<TNodeUid>;
  setContentEditableUidRef: (uid: TNodeUid) => void;

  iframeRefRef: MutableRefObject<HTMLIFrameElement | null>;
  setIframeRefRef: (iframeRef: HTMLIFrameElement | null) => void;

  importProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemDirectoryHandle | null,
    fromURL?: boolean,
  ) => void;
  reloadCurrentProject: (action?: TFileAction) => void;

  onUndo: () => void;
  onRedo: () => void;
};
export type FileNode = {
  type: "file" | "directory";
  name: string;
  children?: FileNode[] | undefined;
  path: string;
};

export type IEditorRef = React.RefObject<editor.IStandaloneCodeEditor | null>;
