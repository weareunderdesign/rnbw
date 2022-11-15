/*  
  File/Node Types
*/


import {
  ADD,
  DUPLICATE,
  MOVE,
  NAME,
  REMOVE,
  RENAME,
  UID,
  UNKNOWN,
} from './global';

// Node Type in the Node Tree View
export type FNHtmlNodeType = string

// File/Node Object
export type FNObject = {
  uid: UID,
  name: NAME,
  parentUID: UID,
  children: UID[],
}

// File/Node File
export type FNFile = {
  [uid: UID]: FNObject,
}

// Various FN[$type]Objects
export interface FNHtmlObject extends FNObject {
  nodeType: FNHtmlNodeType,
  elementType: string,
  data: any,
}
/* export interface FNCSSObject extends FNObject {
  data: any,
} */

/* 
FNNode Actions
1. Action Types
2. Action Payloads
3. Action
4. Action Res
*/

// 1. Action Types
export type FNNodeActionType =
  ADD/* create fnnode */
  | REMOVE/* remove fnnode */
  | MOVE/* cut/paste the fnnode */
  | DUPLICATE/* copy/paste fnnode */
  | RENAME/* rename the fnnode */

// 2. Action Payloads
export type FNNodeActionAddPayload = {
  uid: UID,
  fnNode: FNObject,
  data: FNFile,
}
export type FNNodeActionRemovePayload = {
  fnNode: FNObject,
  data: FNFile,
}
export type FNNodeActionMovePayload = {
  uid: UID,
  fnNode: FNObject,
  data: FNFile,
}
export type FNNodeActionDuplicatePayload = {
  uid: UID,
  fnNode: FNObject,
  data: FNFile,
}
export type FNNodeActionRenamePayload = {
  uid: UID,
  name: NAME,
  data: FNFile,
}

export type FNNodeActionPayload =
  FNNodeActionAddPayload
  | FNNodeActionRemovePayload
  | FNNodeActionMovePayload
  | FNNodeActionDuplicatePayload
  | FNNodeActionRenamePayload

// 3. Action
export type FNNodeAction = {
  type: FNNodeActionType,
  payload: FNNodeActionPayload,
}

// 4. Action Res
export type FNNodeActionRes = FNFile