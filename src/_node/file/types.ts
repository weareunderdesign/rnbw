import JSZip from "jszip";

import { TFileInfo, TFileType } from "@_types/main";

import { TNodeTreeData, TNodeUid } from "../";

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
export type TFileNodeData = {
  valid: boolean;

  path: string;
  kind: "file" | "directory";
  name: string;
  ext: string;
  type: TFileType;

  orgContent: string;
  content: string;
  contentInApp?: string;
  changed: boolean;
};
export type TFileParserResponse = {
  formattedContent: string;
  contentInApp: string;
  tree: TNodeTreeData;
  nodeMaxUid: TNodeUid;
  info?: TFileInfo;
};
