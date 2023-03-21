import {
  TFilesReferenceData,
  THtmlReferenceData,
} from '@_node/index';
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
  TCmdkGroupData,
  TCmdkReferenceData,
  TCodeChange,
  TEvent,
  TFile,
  TFileAction,
  TFileInfo,
  TPanelContext,
  TProject,
  TWorkspace,
} from '@_types/main';

import { TSession } from '../../types/main';

/**
 * main context
 */
export type TMainContext = {
  codeChanges: TCodeChange[],
  setCodeChanges: (changes: TCodeChange[]) => void,

  // global
  pending: boolean,
  setPending: (pending: boolean) => void,

  iframeLoading: boolean,
  setIFrameLoading: (loading: boolean) => void,

  fsPending: boolean,
  setFSPending: (pending: boolean) => void,

  codeEditing: boolean,
  setCodeEditing: (editing: boolean) => void,

  messages: TToast[],
  addMessage: (message: TToast) => void,
  removeMessage: (index: number) => void,

  // groupping action
  addRunningActions: (actionNames: string[]) => void,
  removeRunningActions: (actionNames: string[], effect?: boolean) => void,

  // event
  event: TEvent,
  setEvent: (e: TEvent) => void,

  // file tree view
  ffHoveredItem: TNodeUid,
  setFFHoveredItem: (uid: TNodeUid) => void,

  ffHandlers: TFileHandlerCollection,
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => void,
  ffTree: TNodeTreeData,
  setFFTree: (tree: TNodeTreeData) => void,
  setFFNode: (ffNode: TNode) => void,

  // node tree view
  fnHoveredItem: TNodeUid,
  setFNHoveredItem: (uid: TNodeUid) => void,

  nodeTree: TNodeTreeData,
  setNodeTree: (tree: TNodeTreeData) => void,

  validNodeTree: TNodeTreeData,
  setValidNodeTree: (tree: TNodeTreeData) => void,

  nodeMaxUid: number,
  setNodeMaxUid: (uid: number) => void,

  // update opt
  updateOpt: TUpdateOptions,
  setUpdateOpt: (opt: TUpdateOptions) => void,

  // ff hms
  isHms: boolean | null,
  setIsHms: (is: boolean | null) => void,

  ffAction: TFileAction,
  setFFAction: (action: TFileAction) => void,

  // cmdk
  currentCommand: TCommand,
  setCurrentCommand: (command: TCommand) => void,

  cmdkOpen: boolean,
  setCmdkOpen: (open: boolean) => void,

  cmdkPages: string[],
  setCmdkPages: (pages: string[]) => void,
  cmdkPage: string,


  // reference
  filesReferenceData: TFilesReferenceData,
  htmlReferenceData: THtmlReferenceData,

  cmdkReferenceData: TCmdkReferenceData,
  cmdkReferenceJumpstart: TCmdkGroupData,
  cmdkReferenceActions: TCmdkGroupData,
  cmdkReferenceAdd: TCmdkGroupData,

  // active panel/clipboard
  activePanel: TPanelContext,
  setActivePanel: (panel: TPanelContext) => void,

  clipboardData: TClipboardData,
  setClipboardData: (data: TClipboardData) => void,

  // os
  osType: TOsType,

  // code view
  tabSize: number,
  setTabSize: (size: number) => void,

  // theme
  theme: TTheme,

  // session
  hasSession: boolean,
  session: TSession | null,

  // panel-resize
  panelResizing: boolean,
  setPanelResizing: (resizing: boolean) => void,

  // stage-view
  iframeSrc: null | string,
  setIframeSrc: (src: string | null) => void,

  fileInfo: TFileInfo,
  setFileInfo: (_fileInfo: TFileInfo) => void,

  hasSameScript: boolean,
  setHasSameScript: (_hasSameScript: boolean) => void,
}

/**
 * file handler collection
 */
export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle,
}

/**
 * update opts
 */
export type TUpdateOptions = {
  parse: boolean | null,
  from: 'file' | 'node' | 'settings' | 'styles' | 'stage' | 'code' | 'processor' | 'hms' | null,
  isHms?: boolean,
}

/**
 * command
 */
export type TCommand = {
  action: string,
}

/**
 * main reducer state
 */
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

/**
 * node tree view state
 */
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

/**
 * updateTreeViewState redux-action payload
 */
export type TUpdateTreeViewStatePayload = {
  deletedUids?: TNodeUid[],
  convertedUids?: [TNodeUid, TNodeUid][],
}