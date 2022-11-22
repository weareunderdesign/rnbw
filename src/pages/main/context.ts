import {
  Context,
  createContext,
} from 'react';

import { TUid } from '@_node/types';

/**
 * context type for main page
 */
export type MainContextType = {
  handlers: { [key: TUid]: FileSystemHandle },
  setHandler: (handlers: { uid: TUid, handler: FileSystemHandle }[]) => void,
}

/**
 * Main Page Context
 */
export const MainContext: Context<MainContextType> = createContext<MainContextType>({ handlers: {}, setHandler: () => { } })