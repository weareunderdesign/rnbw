import { TOsType } from "@_redux/global";
import {
  TNodeActionType,
  TNodeReferenceData,
  TNodeTreeData,
  TNodeUid,
} from "..";
import { editor } from "monaco-editor";

export type TNodeApiPayloadBase = {
  fileExt?: string;
  codeViewTabSize?: number;
  action: TNodeActionType;
  nodeTree: TNodeTreeData;
  codeViewInstanceModel: editor.ITextModel;
  osType?: TOsType;
};
export type TNodeApiPayload = TNodeApiPayloadBase &
  // actionName & referenceData
  (| {
        action: Extract<TNodeActionType, "add" | "rename">;
        actionName: string;
        referenceData: TNodeReferenceData;
      }
    | {
        action: Exclude<TNodeActionType, "add" | "rename">;
        actionName?: never;
        referenceData?: never;
      }
  ) &
  // selectedUids
  (| {
        action: Extract<TNodeActionType, "add" | "paste" | "rename">;
        selectedUids?: never;
      }
    | {
        action: Exclude<TNodeActionType, "add" | "paste" | "rename">;
        selectedUids: TNodeUid[];
      }
  ) &
  // targetUid
  (| {
        action: Extract<TNodeActionType, "add" | "paste" | "move" | "rename">;
        targetUid: TNodeUid;
      }
    | {
        action: Exclude<TNodeActionType, "add" | "paste" | "move" | "rename">;
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
