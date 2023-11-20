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

export type TNodeApiPayloadBase = {
  isFileTree: boolean | undefined;
  action: TNodeActionType;
  selectedUids: TNodeUid[];
  isBetween?: boolean;
  position?: number;
  codeViewTabSize?: number;
  osType?: TOsType;
};

export type TNodeApiPayload = TNodeApiPayloadBase &
  (
    | { isFileTree: true; fileExt: string }
    | { isFileTree: false; fileExt?: never }
  ) &
  (
    | { action: "paste"; targetUid: TNodeUid }
    | { action: Exclude<TNodeActionType, "paste"> }
  ) &
  (
    | {
        action: Exclude<TNodeActionType, "copy">;
        codeViewInstance: editor.IStandaloneCodeEditor;
        tree: TNodeTreeData;
      }
    | {
        action: "copy";
        codeViewInstance?: never;
        tree?: never;
      }
  );

export type TNodeActionType =
  | "create"
  | "remove"
  | "duplicate"
  | "move"
  | "copy"
  | "paste";

export type TNodeReferenceData = THtmlReferenceData;
