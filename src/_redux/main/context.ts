import {
  Context,
  createContext,
} from 'react';

import {
  TTree,
  TUid,
} from '@_node/types';
import { FFTree } from '@_types/main';

import {
  FFAction,
  MainContextType,
  Message,
  TClipboardData,
  TCommand,
  TPanel,
  UpdateOptions,
} from './types';

export const MainContext: Context<MainContextType> = createContext<MainContextType>({
  // groupping action
  addRunningActions: (actionNames: string[]) => { },
  removeRunningActions: (actionNames: string[], effect?: boolean) => { },

  // file tree view
  ffHoveredItem: '',
  setFFHoveredItem: (uid: TUid) => { },

  ffHandlers: {},
  ffTree: {},
  setFFTree: (tree: FFTree) => { },
  updateFF: (deletedUids: { [uid: TUid]: boolean }, nodes: FFTree, handlers: { [uid: TUid]: FileSystemHandle }) => { },

  // node tree view
  fnHoveredItem: '',
  setFNHoveredItem: (uid: TUid) => { },

  nodeTree: {},
  setNodeTree: (tree: TTree) => { },

  validNodeTree: {},
  setValidNodeTree: (tree: TTree) => { },

  // update opt
  updateOpt: { parse: null, from: null },
  setUpdateOpt: (opt: UpdateOptions) => { },

  // ff hms
  isHms: null,
  setIsHms: (is: boolean | null) => { },
  ffAction: { name: null },
  setFFAction: (action: FFAction) => { },

  // cmdk
  currentCommand: { action: '', changed: false },
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
  addMessage: (message: Message) => { },
  removeMessage: (index: number) => { },

  // reference
  htmlReferenceData: {},

  cmdkReferenceData: {},
  cmdkReferenceJumpstart: {},
  cmdkReferenceActions: {},
  cmdkReferenceAdd: {},

  // active panel/clipboard
  activePanel: 'other',
  setActivePanel: (panel: TPanel) => { },

  clipboardData: { panel: 'other', type: null, uids: [] },
  setClipboardData: (data: TClipboardData) => { },
})