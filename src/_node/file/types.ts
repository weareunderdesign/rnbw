import JSZip from "jszip";

import { TOsType } from "@_redux/global";

import {
  TBasicNodeData,
  TNode,
  TNodeActionType,
  TNodeTreeData,
  TNodeUid,
} from "../";
import { TFileActionType, TProjectContext } from "@_redux/main/fileTree";
import { AnyAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { TClipboardData } from "@_redux/main/processor";

export type TFileNode = TNode & {
  data: TFileNodeData;
};

export type TFileNodeData = TBasicNodeData & {
  path: string;

  kind: "file" | "directory";
  name: string;
  ext: string;

  orgContent: string;
  content: string;
  contentInApp?: string;

  changed: boolean;
};

export type TFileNodeTreeData = {
  [uid: TNodeUid]: TFileNode;
};

export type TFileParserResponse = {
  contentInApp: string;
  nodeTree: TNodeTreeData;
  [any: string]: any;
};

export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};

export type TFileHandlerInfo = {
  uid: TNodeUid;
  parentUid: TNodeUid | null;
  children: TNodeUid[];

  path: string;
  kind: "directory" | "file";
  name: string;

  ext?: string;
  content?: Uint8Array;

  handler?: FileSystemHandle;
};
export type TFileHandlerInfoObj = { [uid: TNodeUid]: TFileHandlerInfo };

export type TProjectLoaderResponse = {
  handlerArr?: TFileHandlerInfo[];
  _fileHandlers?: TFileHandlerCollection;

  _fileTree: TFileNodeTreeData;
  _initialFileUidToOpen: TNodeUid;

  deletedUids: TNodeUid[];
  deletedUidsObj: { [uid: TNodeUid]: true };
};

export type TFileApiPayloadBase = {
  projectContext: TProjectContext;
  action: TFileActionType;
  fileTree: TFileNodeTreeData;
  fileHandlers?: TFileHandlerCollection;
  osType?: TOsType;
};
export type TFileApiPayload = TFileApiPayloadBase &
  (
    | {
        action: Extract<TFileActionType, "remove" | "cut" | "move">;
        uids: TNodeUid[];
      }
    | {
        action: Exclude<TFileActionType, "remove" | "cut" | "move">;
        uids?: never;
      }
  ) &
  (
    | { action: Extract<TFileActionType, "cut">; currentFileUid: string }
    | { action: Exclude<TFileActionType, "cut">; currentFileUid?: never }
  ) &
  (
    | { action: Extract<TFileActionType, "cut">; nodeTree: TNodeTreeData }
    | { action: Exclude<TFileActionType, "cut">; nodeTree?: never }
  ) &
  (
    | { action: Extract<TFileActionType, "cut">; dispatch: Dispatch<AnyAction> }
    | { action: Exclude<TFileActionType, "cut">; dispatch?: never }
  ) &
  (
    | {
        action: Extract<TFileActionType, "move">;
        clipboardData: TClipboardData | null;
      }
    | { action: Exclude<TFileActionType, "move">; clipboardData?: never }
  ) &
  (
    | {
        action: Extract<TFileActionType, "move">;
        targetNode: TFileNode;
      }
    | { action: Exclude<TFileActionType, "move">; targetNode?: never }
  );

export type TZipFileInfo = {
  path: string;
  zip: JSZip | null | undefined;
};

// --------------------
export type TFile = {
  uid: TNodeUid;
  content: string;
};
