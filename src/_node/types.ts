import { editor } from "monaco-editor";

import { TOsType } from "@_redux/global";
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
};

export type TNodeApiPayload = {
  tree: TNodeTreeData;
  isFileTree: boolean;
  fileExt?: string;

  action: TNodeActionType;

  selectedUids: TNodeUid[];
  tragetUid: TNodeUid;
  isBetween?: boolean;
  position?: number;

  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewTabSize?: number;

  osType?: TOsType;
};

export type TNodeActionType =
  | "create"
  | "remove"
  | "duplicate"
  | "move"
  | "copy";

export type TNodeReferenceData = THtmlReferenceData;
