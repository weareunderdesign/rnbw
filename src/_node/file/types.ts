import JSZip from "jszip";

import { TOsType } from "@_redux/global";
import { TFileActionType, TProjectContext } from "@_redux/main/fileTree";
import { TClipboardData } from "@_redux/main/processor";

import { TBasicNodeData, TNode, TNodeTreeData, TNodeUid } from "../";

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

export type TIDBProjectLoaderBaseResponse = {
  _fileTree: TFileNodeTreeData;
  _initialFileUidToOpen: TNodeUid;

  deletedUids: TNodeUid[];
  deletedUidsObj: { [uid: TNodeUid]: true };
};
export type TLocalProjectLoaderBaseResponse = {
  handlerArr: TFileHandlerInfo[];
  _fileHandlers: TFileHandlerCollection;

  _fileTree: TFileNodeTreeData;
  _initialFileUidToOpen: TNodeUid;

  deletedUids: TNodeUid[];
  deletedUidsObj: { [uid: TNodeUid]: true };
};

export type TFileApiPayloadBase = {
  projectContext: TProjectContext;
  action: TFileActionType;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  osType?: TOsType;
};
export type TFileApiPayload = TFileApiPayloadBase &
  (
    | {
        action: Extract<TFileActionType, "create" | "rename">;
        parentUid: TNodeUid;
        name: string;
      }
    | {
        action: Exclude<TFileActionType, "create" | "rename">;
        parentUid?: never;
        name?: never;
      }
  ) &
  (
    | {
        action: Extract<TFileActionType, "create">;
        kind: "file" | "directory";
      }
    | {
        action: Exclude<TFileActionType, "create">;
        kind?: never;
      }
  ) &
  (
    | {
        action: Extract<
          TFileActionType,
          "remove" | "cut" | "copy" | "move" | "rename"
        >;
        uids: TNodeUid[];
      }
    | {
        action: Exclude<
          TFileActionType,
          "remove" | "cut" | "copy" | "move" | "rename"
        >;
        uids?: never;
      }
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
