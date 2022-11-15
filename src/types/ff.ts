/*  
  Folder/File Types
*/

import {
  ADD,
  CLOSE,
  DUPLICATE,
  MOVE,
  NAME,
  NONE,
  OPEN,
  PATH,
  READ,
  REMOVE,
  RENAME,
  UID,
  UNKNOWN,
  UNLINK,
} from './global';

// File Extension
export type HTML = 'html'
export type CSS = 'css'
export type SCSS = 'scss' | 'sass'
export type JS = 'js'
export type MD = 'md'
export type FileExtension = HTML | CSS | SCSS | JS | MD | UNKNOWN | NONE
export const validFileExtensions: FileExtension[] = ['html', 'css', 'scss', 'sass', 'js', 'md']

// Node Type in the File Tree View
export type FOLDER = 'folder'
export type FILE = 'file'
export type FFNodeType = FOLDER | FILE | UNLINK

// File Content
export type FileContent = string

// Folder/File Object
export type FFObject = {
  uid: UID,
  p_uid: UID | null, // parent UID
  path: PATH, // folder path
  name: NAME, // name.extension
  type: FFNodeType,
  children: UID[],
}

// Workspace
export type Project = FFObject
export type Workspace = {
  [uid: UID]: Project,
}

/* 
FFNode Actions
1. Action Types
2. Action Payloads
3. Action
*/

// 1. Action Types
export type CREATE = 'create'
export type DELETE = 'delete'
export type UPDATE = 'update'
export type FFNodeActionType =
  ADD/* import the project to the workspace */
  | REMOVE/* remove the project from the workspace */

  | OPEN/* expand the folder in the treeview */
  | CLOSE/* collapse the folder in the treeview */

  | READ/* select the file in the treeview */
  | RENAME/* rename the folder/file in the treeview */

  | MOVE/* cut&paste the folder/file s in the treeview */
  | DUPLICATE/* copy&paste the folder/file s in the treeview */

  | CREATE/* create the folder/file in the treeview */
  | DELETE/* delete the folder/file s in the treeview */

  | UPDATE/* update the current file content */

// 2. Action Payloads
export type FFNodeActionAddPayload = {}
export type FFNodeActionRemovePayload = FFObject

export type FFNodeActionOpenPayload = FFObject
export type FFNodeActionClosePayload = FFObject

export type FFNodeActionReadPayload = FFObject
export type FFNodeActionRenamePayload = {
  ffNode: FFObject,
  name: NAME,
}

// ************************************************************************
export type FFNodeActionMovePayload = {
  ffNodes: FFObject[],
  target: FFObject,
  overwrite: boolean,
}
export type FFNodeActionDuplicatePayload = {
  ffNodes: FFObject[],
  target: FFObject,
  overwrite: boolean,
}

export type FFNodeActionCreatePayload = {
  target: FFObject,
  type: FFNodeType,
}
export type FFNodeActionDeletePayload = {
  fnNodes: FFObject[],
}
// ************************************************************************

export type FFNodeActionUpdatePayload = {
  file: FFObject,
  content: FileContent,
}

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

// 3. Action
export type FFNodeAction = {
  type: FFNodeActionType,
  payload: FFNodeActionPayload,
}

/*
Specific Action Res
1. Payloads
2. Action
*/

// 1. Payloads
export type FFNodeActionAddPayloadRes = Project
export type FFNodeActionRemovePayloadRes = UID

export type FFNodeActionOpenPayloadRes = FFObject[]
export type FFNodeActionClosePayloadRes = UID

export type FFNodeActionReadPayloadRes = {
  uid: UID,
  type: FileExtension,
  content: FileContent,
}
export type FFNodeActionRenamePayloadRes = {
  uid: UID,
  name: NAME,
}

// ************************************************************************
export type FFNodeActionMovePayloadRes = {}
export type FFNodeActionDuplicatePayloadRes = {}

export type FFNodeActionCreatePayloadRes = {}
export type FFNodeActionDeletePayloadRes = {}
// ************************************************************************

export type FFNodeActionUpdatePayloadRes = {
  uid: UID,
  type: FileExtension,
  content: FileContent,
}

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

// 2. Action
export type FFNodeActionRes = {
  type: FFNodeActionType,
  payload: FFNodeActionPayloadRes,
}