import { TOS } from '@_types/main';

import { THtmlReferenceData } from './html';

/**
 * unique id for each node
 */
export type TUid = string

/**
 * node data object type
 */
export type TNode = {
  uid: TUid,/* unique id */
  p_uid: TUid | null,/* parent's unique id - null if it has no parent */
  name: string,/* text to be displayed at the node on the tree view */
  isEntity: boolean,/* true if it's an entity */
  children: TUid[],/* children uid list, empty array if it has no child */
  data: any,/* any reference data you want */
}

/**
 * tree data object type
 */
export type TTree = {
  [uid: TUid]: TNode,
}

/**
 * node api res type
 */
export type TNodeApiRes = {
  tree: TTree,
  deletedUids?: TUid[],/* deleted uid array */
  convertedUids?: [TUid, TUid][],/* converted uid array */
}

/**
 * add node api payload type
 */
export type TAddNodePayload = {
  tree: TTree,/* tree data */
  targetUid: TUid,/* target node uid */
  node: TNode,/* node to add */
  os: TOS,
}

/**
 * remove node api payload type
 */
export type TRemoveNodePayload = {
  tree: TTree,/* tree data */
  nodeUids: TUid[],/* node uids to remove - array for multiple feature */
}

/**
 * replace node api payload type
 */
export type TReplaceNodePayload = {
  tree: TTree,/* tree data */
  node: TNode,/* node to replace */
}

/**
 * move(cut & paste) node api payload type
 */
export type TMoveNodePayload = {
  tree: TTree,/* tree data */
  isBetween: boolean,/* true if it's reorder */
  parentUid: TUid,/* parent uid which will be the parent of the nodes */
  position: number,/* child-index if it's reorder */
  uids: TUid[],/* nodes to move - array for multiple feature */
  os: TOS,
}

export type TCopyNodePayload = {
  tree: TTree,
  targetUid: TUid,
  uids: TUid[],
  os: TOS,
}

/**
 * duplicate(copy & paste) node api payload type
 */
export type TDuplicateNodePayload = {
  tree: TTree,/* tree data */
  node: TNode,/* node to duplicate */
  os: TOS,
}

/**
 * update the node data
 */
export type TUpdateNodePayload = {
  tree: TTree,
  uid: TUid,
  data: any,
}

/**
 * ref to valid file types
 */
export type TFileType = 'html' | 'css' | 'js' | 'md' | 'unknown'/* file types that the app can classify */
export type ValidFileTypeType = {
  [ext: string]: boolean,
}
export const validFileType: ValidFileTypeType = {/* valid file types */
  "html": true,
  "css": true,
  "js": true,
  "md": true,
}

/**
 * ref to parsable file types
 */
export type ParsableType = {
  [ext: string]: boolean,
}
export const parsable: ParsableType = {/* parsable file types - we need this since the app can classify but impossible to parse it */
  "html": true,
  "css": false,
  "js": false,
  "md": false,
}

/**
 * parse file api payload type
 */
export type TParseFilePayload = {
  type: string,
  content: string,
  referenceData: THtmlReferenceData,
  os: TOS,
}

/**
 * searialize file api payload type
 */
export type TSearializeFilePayload = {
  type: string,
  tree: TTree,
  referenceData: THtmlReferenceData,
}