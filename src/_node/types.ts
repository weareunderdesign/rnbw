import {
  THtmlNodeData,
  THtmlProcessableNode,
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
  data: TNormalNodeData | THtmlNodeData | THtmlProcessableNode,
}

/**
 * general node data
 */
export type TNormalNodeData = {
  valid: boolean,
  [prop: string]: any,
}

/**
 * node tree data
 */
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

/**
 * general node api response type
 */
export type TNodeApiResponse = {
  tree: TNodeTreeData,
  deletedUids?: TNodeUid[],
  convertedUids?: [TNodeUid, TNodeUid][],
}

/**
 * node reference data
 */
export type TNodeReferenceData = THtmlReferenceData

/**
 * parseFile api response type
 */
export type TFileParserResponse = {
  formattedContent: string,
  tree: TNodeTreeData,
}