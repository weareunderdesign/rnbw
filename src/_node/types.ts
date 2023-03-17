import { TFileInfo } from '@_types/main';

import { TFileNodeData } from './file';
import {
  THtmlDomNodeData,
  THtmlNodeData,
  THtmlReferenceData,
} from './html';

/**
 * unique id for a node
 */
export type TNodeUid = string

/**
 * node
 */
export type TNode = {
  uid: TNodeUid,
  parentUid: TNodeUid | null,
  name: string,
  isEntity: boolean,
  children: TNodeUid[],
  data: TNormalNodeData | TFileNodeData | THtmlNodeData | THtmlDomNodeData,
}
export type TNormalNodeData = {
  valid: boolean,
  [propName: string]: any,
}
export type TFileParserResponse = {
  formattedContent: string,
  contentInApp: string,
  tree: TNodeTreeData,
  nodeMaxUid: TNodeUid,
  info: TFileInfo,
}
export type TNodeApiResponse = {
  tree: TNodeTreeData,
  nodeMaxUid?: TNodeUid,
  deletedUids?: TNodeUid[],
}

export type TNodeTreeData = {
  [uid: TNodeUid]: TNode,
}

/**
 * node tree context
 */
export type TNodeTreeContext = 'file' | 'html' | 'js'

/**
 * resetNodeTreeUids api response type
 */
export type TResetNodeTreeUidsApiResponse = {
  newTree: TNodeTreeData,
  convertedUids: Map<TNodeUid, TNodeUid>,
}




export type TNodeReferenceData = THtmlReferenceData

