/*
------------------------------------------------------------------------------------------
---------------------------------Types for File Tree View---------------------------------
------------------------------------------------------------------------------------------
*/

import {
  TFileType,
  TNode,
  TUid,
} from '@_node/types';

/**
 * node type in file-tree-view
 */
export type FFNodeType = 'folder' | 'file' | 'unlink'

/**
 * node data object type in file-tree-view
 */
export type FFNode = TNode

/**
 * tree type in file-tree-view
 */
export type FFTree = {
  [uid: TUid]: FFNode,
}

/**
 * node action types in file-tree-view
 */
export type FFNodeActionType =
  'add'/* import the project to the workspace */
  | 'remove'/* remove the project from the workspace */
  | 'open'/* expand the folder in the treeview */
  | 'close'/* collapse the folder in the treeview */
  | 'read'/* select the file in the treeview */
  | 'rename'/* rename the folder/file in the treeview */
  | 'move'/* cut&paste the folder/file s in the treeview */
  | 'duplicate'/* copy&paste the folder/file s in the treeview */
  | 'create'/* create the folder/file in the treeview */
  | 'delete'/* delete the folder/file s in the treeview */
  | 'update'/* update the current file content */

/* node action payloads in file-tree-view */
export type FFNodeActionAddPayload = {}
export type FFNodeActionRemovePayload = TUid[]
export type FFNodeActionOpenPayload = FFNode
export type FFNodeActionClosePayload = TUid[]
export type FFNodeActionReadPayload = FFNode
export type FFNodeActionRenamePayload = {
  nodes: FFNode[],
  name: string,
}
// ************************************************************************
export type FFNodeActionMovePayload = {
  nodes: FFNode[],
  target: FFNode,
  overwrite: boolean,
}
export type FFNodeActionDuplicatePayload = {
  nodes: FFNode[],
  target: FFNode,
  overwrite: boolean,
}

export type FFNodeActionCreatePayload = {
  target: FFNode,
  type: FFNodeType,
}
export type FFNodeActionDeletePayload = {
  nodes: FFNode[],
}
// ************************************************************************
export type FFNodeActionUpdatePayload = {
  file: FFNode,
  content: string,
}

/**
 * node action payload in file-tree-view
 */
export type FFNodeActionPayload =
  FFNodeActionAddPayload
  | FFNodeActionRemovePayload
  | FFNodeActionOpenPayload
  | FFNodeActionClosePayload
  | FFNodeActionReadPayload
  | FFNodeActionRenamePayload
  | FFNodeActionMovePayload
  | FFNodeActionDuplicatePayload
  | FFNodeActionCreatePayload
  | FFNodeActionDeletePayload
  | FFNodeActionUpdatePayload

/**
 * node action object type in file-tree-view
 */
export type FFNodeAction = {
  type: FFNodeActionType,
  payload: FFNodeActionPayload,
}

/* node action api res payload */
export type FFNodeActionAddPayloadRes = FFNode
export type FFNodeActionRemovePayloadRes = TUid[]
export type FFNodeActionOpenPayloadRes = FFNode[]
export type FFNodeActionClosePayloadRes = TUid[]
export type FFNodeActionReadPayloadRes = {
  uid: TUid,
  type: TFileType,
  content: string,
}
export type FFNodeActionRenamePayloadRes = {
  nodes: FFNode[],
  name: string,
}
// ************************************************************************
export type FFNodeActionMovePayloadRes = {}
export type FFNodeActionDuplicatePayloadRes = {}
export type FFNodeActionCreatePayloadRes = {}
export type FFNodeActionDeletePayloadRes = {}
// ************************************************************************
export type FFNodeActionUpdatePayloadRes = {
  uid: TUid,
  type: TFileType,
  content: string,
}

/**
 * node action api res type in file-tree-view
 */
export type FFNodeActionPayloadRes =
  FFNodeActionAddPayloadRes
  | FFNodeActionRemovePayloadRes
  | FFNodeActionOpenPayloadRes
  | FFNodeActionClosePayloadRes
  | FFNodeActionReadPayloadRes
  | FFNodeActionRenamePayloadRes
  | FFNodeActionMovePayloadRes
  | FFNodeActionDuplicatePayloadRes
  | FFNodeActionCreatePayloadRes
  | FFNodeActionDeletePayloadRes
  | FFNodeActionUpdatePayloadRes

/**
 * node action api res type in file-tree-view
 */
export type FFNodeActionRes = {
  type: FFNodeActionType,
  payload: FFNodeActionPayloadRes,
}