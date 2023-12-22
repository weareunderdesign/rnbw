import { TNodeUid } from "@_node/types";

export type TFileEventReducerState = {
  fileAction: TFileAction;
};

export type TFileAction = { action: TFileActionType } & (
  | {
      action: Extract<TFileActionType, "create" | "remove" | "move">;
      payload: {
        uids: TNodeUid[];
      };
    }
  | {
      action: Extract<TFileActionType, "rename">;
      payload: {
        orgUid: string;
        newUid: string;
      };
    }
  | {
      action: null;
      payload?: never;
    }
);
export type TFileActionType =
  | "create"
  | "remove"
  | "move"
  | "rename"
  | "duplicate"
  | "cut"
  | "copy"
  | null;
