import {
  Context,
  createContext,
} from 'react';

import { FFContextType } from '@_types/ff';

export const FFContext: Context<FFContextType> = createContext<FFContextType>({ ffHandlers: {}, setFFHandlers: () => { }, unsetFFHandlers: () => { } })