import { TFileType } from '@_types/main';

import { TNodeUid } from '../';

/**
 * files reference data
 */
export type TFilesReferenceData = {
  [name: string]: TFilesReference,
}

/**
 * files reference
 */
export type TFilesReference = {
  "Name": string,
  "Extension": string,
  "Type": string,
  "Icon": string,
  "Description": string,
  "Featured": string,
}

export type TFileHandlerInfo = {
  uid: TNodeUid,
  parentUid: TNodeUid | null,
  path: string,
  kind: 'directory' | 'file',
  name: string,
  ext?: string,
  handler: FileSystemHandle,
  content?: string,
  children: TNodeUid[],
}

export type TFileHandlerInfoObj = { [uid: TNodeUid]: TFileHandlerInfo }

export type TFileNodeData = {
  valid: boolean,

  path: string,
  kind: 'file' | 'directory',
  name: string,
  ext: string,
  type: TFileType,

  orgContent: string,
  content: string,
  contentInApp?: string,
  changed: boolean,
}