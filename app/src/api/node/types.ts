import { Dispatch } from "react";

import { editor } from "monaco-editor";

import { TOsType } from "@_redux/global";
import { AnyAction } from "@reduxjs/toolkit";

import {
  TNodeActionType,
  TNodeReferenceData,
  TNodeTreeData,
  TNodeUid,
} from "../";

export type TNodeApiPayloadBase = {
  dispatch: Dispatch<AnyAction>;
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
        action: Extract<
          TNodeActionType,
          "add" | "paste" | "rename" | "text-edit"
        >;
        selectedUids?: never;
      }
    | {
        action: Exclude<
          TNodeActionType,
          "add" | "paste" | "rename" | "text-edit"
        >;
        selectedUids: TNodeUid[];
      }
  ) &
  // targetUid
  (| {
        action: Extract<
          TNodeActionType,
          "add" | "paste" | "move" | "rename" | "text-edit"
        >;
        targetUid: TNodeUid;
      }
    | {
        action: Exclude<
          TNodeActionType,
          "add" | "paste" | "move" | "rename" | "text-edit"
        >;
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
  ) &
  // content - only for text-edit
  (| {
        action: Extract<TNodeActionType, "text-edit">;
        content: TNodeUid;
      }
    | {
        action: Exclude<TNodeActionType, "text-edit">;
        content?: never;
      }
  );
