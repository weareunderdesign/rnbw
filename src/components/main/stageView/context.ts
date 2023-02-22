import {
  Context,
  createContext,
} from 'react';

import { TNodeUid } from '@_node/types';

import { StageViewContextType } from './types';

export const StageViewContext: Context<StageViewContextType> = createContext<StageViewContextType>({
  setFocusedItem: (uid: TNodeUid) => { },
})