import { TNodeUid } from "@_node/types";

export type TNodeEventReducerState = {
  currentFileContent: string;
  selectedNodeUids: TNodeUid[];
};

export type TNodeEvent = {
  type: TNodeEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param: any[];
} | null;
export type TNodeEventType =
  | "group"
  | "ungroup"
  | "add-node"
  | "copy-node-external"
  | "move-node";
