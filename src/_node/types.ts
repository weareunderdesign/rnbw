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
  action: TNodeActionType;
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
  osType?: TOsType;
};
export type TNodeApiPayload = TNodeApiPayloadBase &
  // isFileTree & fileExt & codeViewTabSize
  (| { isFileTree: true; fileExt: never; codeViewTabSize?: never }
    | { isFileTree?: false; fileExt?: string; codeViewTabSize?: number }
  ) &
  // nodeTree & validNodeTree
  (| {
        action: Extract<TNodeActionType, "paste" | "group" | "ungroup">;
        nodeTree?: never;
        validNodeTree: TNodeTreeData;
      }
    | {
        action: Exclude<TNodeActionType, "paste" | "group" | "ungroup">;
        nodeTree: TNodeTreeData;
        validNodeTree?: never;
      }
  ) &
  // actionName & referenceData
  (| {
        action: Extract<TNodeActionType, "add">;
        actionName: string;
        referenceData: TNodeReferenceData;
      }
    | {
        action: Exclude<TNodeActionType, "add">;
        actionName?: never;
        referenceData?: never;
      }
  ) &
  // selectedUids
  (| {
        action: Extract<TNodeActionType, "add" | "paste">;
        selectedUids?: never;
      }
    | {
        action: Exclude<TNodeActionType, "add" | "paste">;
        selectedUids: TNodeUid[];
      }
  ) &
  // targetUid
  (| {
        action: Extract<TNodeActionType, "add" | "paste" | "move">;
        targetUid: TNodeUid;
      }
    | {
        action: Exclude<TNodeActionType, "add" | "paste" | "move">;
        targetUid?: never;
      }
  ) &
  // isBetween & position
  (| {
        action: Extract<TNodeActionType, "move">;
        isBetween: boolean;
        position: number;
      }
    | {
        action: Exclude<TNodeActionType, "move">;
        isBetween?: never;
        position?: never;
      }
  );

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
  | "ungroup";

export type TNodeReferenceData = THtmlReferenceData;
