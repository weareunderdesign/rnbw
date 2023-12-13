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
    | { action: Extract<TFileActionType, "remove">; uids: TNodeUid[] }
    | { action: Exclude<TFileActionType, "remove">; uids?: never }
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
