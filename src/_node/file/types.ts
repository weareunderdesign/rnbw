import { TFileType } from '@_types/main';

import { TNodeUid } from '../';

export type TFileHandlerInfo = {
  uid: TNodeUid,
  parentUid: TNodeUid | null,
  children: TNodeUid[],

  path: string,
  kind: 'directory' | 'file',
  name: string,
  ext?: string,

  content?: string,

  handler: FileSystemHandle,
}
export type TFileHandlerInfoObj = { [uid: TNodeUid]: TFileHandlerInfo }




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