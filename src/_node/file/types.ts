import JSZip from "jszip";

import {
  TBasicNodeData,
  TNode,
  TNodeActionType,
  TNodeTreeData,
  TNodeUid,
} from "../";
import { TOsType } from "@_redux/global";

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

export type TFileApiPayload = {
  action: TNodeActionType;
  osType?: TOsType;
};
// --------------------
export type TFile = {
  uid: TNodeUid;
  content: string;
};

export type TZipFileInfo = {
  path: string;
  zip: JSZip | null | undefined;
};
