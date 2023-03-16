import {
  Context,
  createContext,
} from 'react';

import { DefaultTabSize } from '@_constants/main';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import { TToast } from '@_types/global';
import {
  TClipboardData,
  TFileAction,
  TFileInfo,
  TPanelContext,
} from '@_types/main';

import {
  TCommand,
  TFileHandlerCollection,
  TMainContext,
  TUpdateOptions,
} from './types';

export const MainContext: Context<TMainContext> = createContext<TMainContext>({
  // groupping action
  addRunningActions: (actionNames: string[]) => { },
  removeRunningActions: (actionNames: string[], effect?: boolean) => { },

  // file tree view
  ffHoveredItem: '',
  setFFHoveredItem: (uid: TNodeUid) => { },

  ffHandlers: {},
  setFFHandlers: (ffHandlerObj: TFileHandlerCollection) => { },
  ffTree: {},
  setFFTree: (tree: TNodeTreeData) => { },
  setFFNode: (ffNode: TNode) => { },

  // node tree view
  fnHoveredItem: '',
  setFNHoveredItem: (uid: TNodeUid) => { },

  nodeTree: {},
  setNodeTree: (tree: TNodeTreeData) => { },

  validNodeTree: {},
  setValidNodeTree: (tree: TNodeTreeData) => { },

  // update opt
  updateOpt: { parse: null, from: null },
  setUpdateOpt: (opt: TUpdateOptions) => { },

  // ff hms
  isHms: null,
  setIsHms: (is: boolean | null) => { },

  ffAction: { type: null },
  setFFAction: (action: TFileAction) => { },

  // cmdk
  currentCommand: { action: '' },
  setCurrentCommand: (command: TCommand) => { },

  cmdkOpen: false,
  setCmdkOpen: (open: boolean) => { },

  cmdkPages: [],
  setCmdkPages: (pages: string[]) => { },
  cmdkPage: '',

  // global
  pending: false,
  setPending: (pending: boolean) => { },

  messages: [],
  addMessage: (message: TToast) => { },
  removeMessage: (index: number) => { },

  // reference
  filesReferenceData: {},
  htmlReferenceData: {
    elements: {},
  },

  cmdkReferenceData: {},
  cmdkReferenceJumpstart: {},
  cmdkReferenceActions: {},
  cmdkReferenceAdd: {},

  // active panel/clipboard
  activePanel: 'unknown',
  setActivePanel: (panel: TPanelContext) => { },

  clipboardData: { panel: 'unknown', type: null, uids: [] },
  setClipboardData: (data: TClipboardData) => { },

  // os
  osType: 'Windows',

  // code view
  tabSize: DefaultTabSize,
  setTabSize: (size: number) => { },

  // theme
  theme: 'System',

  // session
  hasSession: false,
  session: null,

  // panel-resize
  panelResizing: false,
  setPanelResizing: (resizing: boolean) => { },

  // stage-view
  iframeSrc: null,
  setIframeSrc: (src: string | null) => { },

  fileInfo: null,
  setFileInfo: (_fileInfo: TFileInfo) => { },

  hasSameScript: false,
  setHasSameScript: (_hasSameScript: boolean) => { },
})