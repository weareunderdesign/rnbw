import { TNodeUid } from "@_node/types";

export type TFileEventReducerState = {
  fileAction: TFileAction;
};

export type TFileAction = { action: TFileActionType } & (
  | {
      action: Extract<TFileActionType, "create" | "remove">;
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
      action: Extract<TFileActionType, "move">;
      payload: {
        uids: {
          orgUid: string;
          newUid: string;
        }[];
        isCopy: boolean;
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
