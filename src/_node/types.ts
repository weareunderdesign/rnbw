import { TFileNodeData } from './file';
import {
  THtmlDomNodeData,
  THtmlNodeData,
  THtmlReferenceData,
} from './html';

export type TNodeUid = string
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
export type TNodeTreeData = {
  [uid: TNodeUid]: TNode,
}
export type TNodeTreeContext = 'file' | 'html'
export type TNodeApiResponse = {
  tree: TNodeTreeData,
  nodeMaxUid?: TNodeUid,
  deletedUids?: TNodeUid[],
  addedUidMap?: Map<TNodeUid, TNodeUid>,
  position?: number,
  lastNodeUid?: TNodeUid,
}
export type TNodeReferenceData = THtmlReferenceData
export type TEvent = {
  type: "add-node" | "remove-node" | "move-node" | "duplicate-node" | "copy-node" | "copy-node-external" | "code-change";
  param: any[];
};