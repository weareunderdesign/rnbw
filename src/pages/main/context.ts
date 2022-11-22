import {
  Context,
  createContext,
} from 'react';

import { TUid } from '@_node/types';

export type MainContextType = {
  handlers: { [key: TUid]: FileSystemHandle },
  setHandler: (handlers: { uid: TUid, handler: FileSystemHandle }[]) => void,
}
export const MainContext: Context<MainContextType> = createContext<MainContextType>({ handlers: {}, setHandler: () => { } })