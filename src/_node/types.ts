import { THtmlReferenceData } from "./html";

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
};

// --------------------

export type TNodeTreeContext = "file" | "html";
export type TNodeApiResponse = {
  tree: TNodeTreeData;
  nodeMaxUid?: TNodeUid;
  deletedUids?: TNodeUid[];
  addedUidMap?: Map<TNodeUid, TNodeUid>;
  position?: number;
  lastNodeUid?: TNodeUid;
};
export type TNodeReferenceData = THtmlReferenceData;
