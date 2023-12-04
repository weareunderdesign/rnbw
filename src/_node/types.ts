import { THtmlReferenceData } from "@_types/main";

export type TNode = {
  uid: TNodeUid;
  parentUid: TNodeUid | null;

  displayName: string;

  isEntity: boolean;
  children: TNodeUid[];

  data: TNodeData;
};

export type TNodeUid = string;

export type TNodeData = TBasicNodeData & { [propName: string]: any };

export type TBasicNodeData = {
  valid: boolean;
};

export type TNodeTreeData = {
  [uid: TNodeUid]: TNode;
};

export type TNodeSourceCodeLocation = {
  startLine: number;
  startCol: number;
  startOffset: number;
  endLine: number;
  endCol: number;
  endOffset: number;
  startTag?: Omit<TNodeSourceCodeLocation, "startTag" | "endTag">;
  endTag?: Omit<TNodeSourceCodeLocation, "startTag" | "endTag">;
};

export type TNodeActionType =
  | "add"
  | "remove"
  | "cut"
  | "copy"
  | "paste"
  | "duplicate"
  | "move"
  | "rename" // "turn into" for node tree - "rename" for file tree
  | "group"
  | "ungroup"
  | "text-edit";

export type TNodeReferenceData = THtmlReferenceData;
