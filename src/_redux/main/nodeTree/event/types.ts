import { TNodeUid } from "@_node/types";

export type TNodeTreeEventReducerState = {
  currentFileContent: string;
  selectedNodeUids: TNodeUid[];
  nodeEvent: TNodeEvent;
};

export type TNodeEvent = {
  type: TNodeEventType;
  param: any[];
} | null;
export type TNodeEventType =
  | "group"
  | "ungroup"
  | "add-node"
  | "copy-node-external"
  | "move-node";
