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
  Command,
  MainContextType,
  Message,
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

  // cmdk
  command: { action: '', changed: false },
  setCommand: (command: Command) => { },

  // global
  pending: false,
  setPending: (pending: boolean) => { },

  messages: [],
  addMessage: (message: Message) => { },
  removeMessage: (index: number) => { },
})