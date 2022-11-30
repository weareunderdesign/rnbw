import {
  Context,
  createContext,
} from 'react';

import { MainContextType } from './types';

export const MainContext: Context<MainContextType> = createContext<MainContextType>({ ffHandlers: {}, setFFHandlers: () => { } })