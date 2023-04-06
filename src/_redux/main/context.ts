import {
  Context,
  createContext,
} from 'react';

import { DefaultTabSize } from '@_constants/main';
import { TFileHandlerCollection } from '@_node/file';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import { TToast } from '@_types/global';
import {
  TClipboardData,
  TCodeChange,
  TEvent,
  TFileAction,
  TFileInfo,
  TPanelContext,
} from '@_types/main';

import {
  TCommand,
  TMainContext,
  TUpdateOptions,
} from './types';

export const MainContext: Context<TMainContext> = createContext<TMainContext>({
  // global action
  addRunningActions: (actionNames: string[]) => { },
  removeRunningActions: (actionNames: string[], effect?: boolean) => { },
  // node actions
  activePanel: 'unknown',
  setActivePanel: (panel: TPanelContext) => { },
  clipboardData: { panel: 'unknown', type: null, uids: [] },
  setClipboardData: (data: TClipboardData) => { },
  event: null,
  setEvent: (e: TEvent) => { },
  // file tree view
  initialFileToOpen: '',
  setInitialFileToOpen: (uid: TNodeUid) => { },
  fsPending: false,
  setFSPending: (pending: boolean) => { },
  ffTree: {},
  setFFTree: (tree: TNodeTreeData) => { },
  setFFNode: (ffNode: TNode) => { },
  ffHandlers: {},
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => { },
  ffHoveredItem: '',
  setFFHoveredItem: (uid: TNodeUid) => { },
  isHms: null,
  setIsHms: (is: boolean | null) => { },
  ffAction: { type: null },
  setFFAction: (action: TFileAction) => { },
  currentFileUid: 'TNodeUid',
  setCurrentFileUid: (uid: TNodeUid) => { },
  // node tree view
  fnHoveredItem: '',
  setFNHoveredItem: (uid: TNodeUid) => { },
  nodeTree: {},
  setNodeTree: (tree: TNodeTreeData) => { },
  validNodeTree: {},
  setValidNodeTree: (tree: TNodeTreeData) => { },
  nodeMaxUid: 0,
  setNodeMaxUid: (uid: number) => { },
  // stage view
  iframeLoading: false,
  setIFrameLoading: (loading: boolean) => { },
  iframeSrc: null,
  setIFrameSrc: (src: string | null) => { },
  fileInfo: null,
  setFileInfo: (_fileInfo: TFileInfo) => { },
  needToReloadIFrame: true,
  setNeedToReloadIFrame: (_needToReloadIFrame: boolean) => { },
  // code view
  codeEditing: false,
  setCodeEditing: (editing: boolean) => { },
  codeChanges: [],
  setCodeChanges: (changes: TCodeChange[]) => { },
  tabSize: DefaultTabSize,
  setTabSize: (size: number) => { },
  newFocusedNodeUid: '',
  setNewFocusedNodeUid: (uid: TNodeUid) => { },
  // processor
  updateOpt: { parse: null, from: null },
  setUpdateOpt: (opt: TUpdateOptions) => { },
  // references
  filesReferenceData: {},
  htmlReferenceData: {
    elements: {},
  },
  cmdkReferenceData: {},
  // cmdk
  currentCommand: { action: '' },
  setCurrentCommand: (command: TCommand) => { },
  cmdkOpen: false,
  setCmdkOpen: (open: boolean) => { },
  cmdkPages: [],
  setCmdkPages: (pages: string[]) => { },
  cmdkPage: '',
  // other
  osType: 'Windows',
  theme: 'System',
  panelResizing: false,
  setPanelResizing: (resizing: boolean) => { },
  // toasts
  addMessage: (message: TToast) => { },
  removeMessage: (index: number) => { },
})