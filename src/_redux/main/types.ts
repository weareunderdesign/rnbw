import { editor } from "monaco-editor";

import {
  TFileAction,
  TFileHandlerCollection,
  TFilesReferenceData,
} from "@_node/file";
import { THtmlReferenceData } from "@_node/html";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { TOsType, TTheme, TToast } from "@_types/global";
import {
  TClipboardData,
  TCmdkReferenceData,
  TCodeChange,
  TEvent,
  TFileInfo,
  TPanelContext,
  TProject,
  TProjectContext,
  TWorkspace,
} from "@_types/main";

export type TFileTreeReducerState = {
  fileAction: TFileAction;
};

export type TNodeTreeReducerState = {
  fileContent: string;
  selectedItems: TNodeUid[];
};

export type TEventHistoryInfo = {
  fileTree: {
    future: number;
    past: number;
  };
  nodeTree: {
    future: number;
    past: number;
  };
};

// --------------------
export type TMainContext = {
  // navigator
  workspace: TWorkspace;
  setWorkspace: (ws: TWorkspace) => void;
  project: TProject;
  navigatorDropDownType: TNavigatorDropDownType;
  setNavigatorDropDownType: (type: TNavigatorDropDownType) => void;
  // node actions
  activePanel: TPanelContext;
  setActivePanel: (panel: TPanelContext) => void;
  clipboardData: TClipboardData;
  setClipboardData: (data: TClipboardData) => void;
  event: TEvent;
  // favicon
  favicon: string;
  setFavicon: (_favicon: string) => void;
  setEvent: (e: TEvent) => void;
  // actions panel
  showActionsPanel: boolean;
  // file tree view
  initialFileToOpen: TNodeUid;
  setInitialFileToOpen: (uid: TNodeUid) => void;
  fsPending: boolean;
  setFSPending: (pending: boolean) => void;
  ffTree: TNodeTreeData;
  setFFTree: (tree: TNodeTreeData) => void;
  setFFNode: (ffNode: TNode) => void;
  ffHandlers: TFileHandlerCollection;
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => void;
  ffHoveredItem: TNodeUid;
  setFFHoveredItem: (uid: TNodeUid) => void;
  isHms: boolean | null;
  setIsHms: (is: boolean | null) => void;
  ffAction: TFileAction;
  setFFAction: (action: TFileAction) => void;
  currentFileUid: TNodeUid;
  setCurrentFileUid: (uid: TNodeUid) => void;
  // code view
  showCodeView: boolean;
  setShowCodeView: (show: boolean) => void;
  // node tree view
  fnHoveredItem: TNodeUid;
  setFNHoveredItem: (uid: TNodeUid) => void;
  nodeTree: TNodeTreeData;
  setNodeTree: (tree: TNodeTreeData) => void;
  validNodeTree: TNodeTreeData;
  setValidNodeTree: (tree: TNodeTreeData) => void;
  nodeMaxUid: number;
  setNodeMaxUid: (uid: number) => void;
  // stage view
  iframeLoading: boolean;
  setIFrameLoading: (loading: boolean) => void;
  iframeSrc: string | null;
  setIFrameSrc: (src: string | null) => void;
  fileInfo: TFileInfo;
  setFileInfo: (_fileInfo: TFileInfo) => void;
  needToReloadIFrame: boolean;
  setNeedToReloadIFrame: (_needToReloadIFrame: boolean) => void;
  linkToOpen: string;
  setLinkToOpen: (href: string) => void;
  // code view
  codeEditing: boolean;
  setCodeEditing: (editing: boolean) => void;
  isContentProgrammaticallyChanged: React.RefObject<boolean>;
  setIsContentProgrammaticallyChanged: (changed: boolean) => void;
  codeChanges: TCodeChange[];
  setCodeChanges: (changes: TCodeChange[]) => void;
  tabSize: number;
  setTabSize: (size: number) => void;
  newFocusedNodeUid: TNodeUid;
  setNewFocusedNodeUid: (uid: TNodeUid) => void;
  setCodeViewOffsetTop: (offsetTop: string) => void;
  // processor
  updateOpt: TUpdateOptions;
  setUpdateOpt: (opt: TUpdateOptions) => void;
  // references
  filesReferenceData: TFilesReferenceData;
  htmlReferenceData: THtmlReferenceData;
  cmdkReferenceData: TCmdkReferenceData;
  // cmdk
  currentCommand: TCommand;
  setCurrentCommand: (command: TCommand) => void;
  cmdkOpen: boolean;
  setCmdkOpen: (open: boolean) => void;
  cmdkPages: string[];
  setCmdkPages: (pages: string[]) => void;
  cmdkPage: string;
  // other
  osType: TOsType;
  theme: TTheme;
  // toasts
  addMessage: (message: TToast) => void;
  removeMessage: (index: number) => void;
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
  monacoEditorRef: IEditorRef;
  setMonacoEditorRef: (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => void;
};

export type TUpdateOptions = {
  parse: boolean | null;
  from:
    | "file"
    | "node"
    | "settings"
    | "styles"
    | "stage"
    | "code"
    | "processor"
    | "hms"
    | null;
  isHms?: boolean;
};
export type TCommand = {
  action: string;
};
export type TNavigatorDropDownType = "workspace" | "project" | null;

export type TUpdateTreeViewStatePayload = {
  deletedUids?: TNodeUid[];
  convertedUids?: [TNodeUid, TNodeUid][];
};

export type IEditorRef = React.RefObject<editor.IStandaloneCodeEditor | null>;
