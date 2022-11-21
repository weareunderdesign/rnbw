import { TUid } from "@_node/types";
import { Context, createContext } from "react";

export type MainContextType = {
    handlers: { [key: TUid]: FileSystemHandle },
    setHandler: (handlers: { uid: TUid, handler: FileSystemHandle }[]) => void,
}
export const MainContext: Context<MainContextType> = createContext<MainContextType>({ handlers: {}, setHandler: () => { } })