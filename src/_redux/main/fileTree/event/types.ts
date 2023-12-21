import { TNodeUid } from "@_node/types";

export type TFileEventReducerState = {
  fileAction: TFileAction;
};

export type TFileAction = {
  action: TFileActionType;
  payload?: {
    uids: TNodeUid[];
  };
};
export type TFileActionType =
  | "create"
  | "remove"
  | "move"
  | "rename"
  | "duplicate"
  | "cut"
  | "copy"
  | null;
