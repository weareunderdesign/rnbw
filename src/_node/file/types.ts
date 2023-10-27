import JSZip from 'jszip';

import {
  TBasicNodeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '../';

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

// --------------------
export type TFile = {
  uid: TNodeUid;
  content: string;
};


export type TZipFileInfo = {
  path: string;
  zip: JSZip | null | undefined;
};
export type TIDBFileInfo = {
  uid: TNodeUid;
  parentUid: TNodeUid | null;
  children: TNodeUid[];

  path: string;
  kind: "directory" | "file";
  name: string;

  ext?: string;
  content?: Uint8Array;
};
export type TIDBFileInfoObj = {
  [uid: TNodeUid]: TIDBFileInfo;
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

  handler: FileSystemHandle;
};
export type TFileHandlerCollection = {
  [uid: TNodeUid]: FileSystemHandle;
};
export type TFileHandlerInfoObj = { [uid: TNodeUid]: TFileHandlerInfo };
export type TFilesReference = {
  Name: string;
  Extension: string;
  Type: string;
  Icon: string;
  Description: string;
  Featured: string;
};
export type TFilesReferenceData = {
  [name: string]: TFilesReference;
};
