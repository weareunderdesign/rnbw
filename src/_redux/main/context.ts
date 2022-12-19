import {
  Context,
  createContext,
} from 'react';

import { MainContextType } from './types';

export const MainContext: Context<MainContextType> = createContext<MainContextType>({
  // file tree view
  ffHoveredItem: '',
  setFFHoveredItem: () => { },

  ffHandlers: {},
  setFFHandlers: () => { },

  // node tree view
  fnHoveredItem: '',
  setFNHoveredItem: () => { },

  nodeTree: {},
  setNodeTree: () => { },

  validNodeTree: {},
  setValidNodeTree: () => { },

  // cmdk
  command: { action: '', changed: true },
  setCommand: () => { },
})