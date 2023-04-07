import {
  TFileHandlerCollection,
  TFilesReferenceData,
} from '@_node/file';
import { THtmlReferenceData } from '@_node/html';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import {
  TOsType,
  TTheme,
  TToast,
} from '@_types/global';
import {
  TClipboardData,
  TCmdkReferenceData,
  TCodeChange,
  TEvent,
  TFile,
  TFileAction,
  TFileInfo,
  TPanelContext,
  TProject,
  TSession,
  TWorkspace,
} from '@_types/main';

export type TMainReducerState = {
  actionGroupIndex: number,
  navigator: {
    workspace: TWorkspace,
    project: TProject,
    file: TFile,
  },
  global: {
    fileAction: TFileAction,
  },
  fileTreeViewState: TTreeViewState,
  nodeTreeViewState: TTreeViewState,
}
export type TMainContext = {
  // global action
  addRunningActions: (actionNames: string[]) => void,
  removeRunningActions: (actionNames: string[], effect?: boolean) => void,
  // node actions
  activePanel: TPanelContext,
  setActivePanel: (panel: TPanelContext) => void,
  clipboardData: TClipboardData,
  setClipboardData: (data: TClipboardData) => void,
  event: TEvent,
  setEvent: (e: TEvent) => void,
  // file tree view
  fsPending: boolean,
  setFSPending: (pending: boolean) => void,
  ffTree: TNodeTreeData,
  setFFTree: (tree: TNodeTreeData) => void,
  setFFNode: (ffNode: TNode) => void,
  ffHandlers: TFileHandlerCollection,
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => void,
  ffHoveredItem: TNodeUid,
  setFFHoveredItem: (uid: TNodeUid) => void,
  isHms: boolean | null,
  setIsHms: (is: boolean | null) => void,
  ffAction: TFileAction,
  setFFAction: (action: TFileAction) => void,
  currentFileUid: TNodeUid,
  setCurrentFileUid: (uid: TNodeUid) => void,
  // node tree view
  fnHoveredItem: TNodeUid,
  setFNHoveredItem: (uid: TNodeUid) => void,
  nodeTree: TNodeTreeData,
  setNodeTree: (tree: TNodeTreeData) => void,
  validNodeTree: TNodeTreeData,
  setValidNodeTree: (tree: TNodeTreeData) => void,
  nodeMaxUid: number,
  setNodeMaxUid: (uid: number) => void,
  // stage view
  iframeLoading: boolean,
  setIFrameLoading: (loading: boolean) => void,
  iframeSrc: string | null,
  setIFrameSrc: (src: string | null) => void,
  fileInfo: TFileInfo,
  setFileInfo: (_fileInfo: TFileInfo) => void,
  needToReloadIFrame: boolean,
  setNeedToReloadIFrame: (_needToReloadIFrame: boolean) => void,
  linkToOpen: string,
  setLinkToOpen: (href: string) => void,
  // code view
  codeEditing: boolean,
  setCodeEditing: (editing: boolean) => void,
  codeChanges: TCodeChange[],
  setCodeChanges: (changes: TCodeChange[]) => void,
  tabSize: number,
  setTabSize: (size: number) => void,
  newFocusedNodeUid: TNodeUid,
  setNewFocusedNodeUid: (uid: TNodeUid) => void,
  // processor
  updateOpt: TUpdateOptions,
  setUpdateOpt: (opt: TUpdateOptions) => void,
  // references
  filesReferenceData: TFilesReferenceData,
  htmlReferenceData: THtmlReferenceData,
  cmdkReferenceData: TCmdkReferenceData,
  // cmdk
  currentCommand: TCommand,
  setCurrentCommand: (command: TCommand) => void,
  cmdkOpen: boolean,
  setCmdkOpen: (open: boolean) => void,
  cmdkPages: string[],
  setCmdkPages: (pages: string[]) => void,
  cmdkPage: string,
  // other
  osType: TOsType,
  theme: TTheme,
  panelResizing: boolean,
  setPanelResizing: (resizing: boolean) => void,
  hasSession: boolean,
  session: TSession | null,
  // toasts
  addMessage: (message: TToast) => void,
  removeMessage: (index: number) => void,
}
export type TUpdateOptions = {
  parse: boolean | null,
  from: 'file' | 'node' | 'settings' | 'styles' | 'stage' | 'code' | 'processor' | 'hms' | null,
  isHms?: boolean,
}
export type TCommand = {
  action: string,
}
export type TTreeViewState = {
  focusedItem: TNodeUid,
  expandedItems: TNodeUid[],
  expandedItemsObj: {
    [uid: TNodeUid]: boolean,
  },
  selectedItems: TNodeUid[],
  selectedItemsObj: {
    [uid: TNodeUid]: boolean,
  },
}
export type TUpdateTreeViewStatePayload = {
  deletedUids?: TNodeUid[],
  convertedUids?: [TNodeUid, TNodeUid][],
}