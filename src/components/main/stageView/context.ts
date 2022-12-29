import {
  Context,
  createContext,
} from 'react';

import { TUid } from '@_node/types';

import { StageViewContextType } from './types';

export const StageViewContext: Context<StageViewContextType> = createContext<StageViewContextType>({
  setFocusedItem: (uid: TUid) => { },
})