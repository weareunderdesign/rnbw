/*
------------------------------------------------------------------------------------------
---------------------------------Types for File Tree View---------------------------------
------------------------------------------------------------------------------------------
*/

import {
  TNode,
  TUid,
} from '@_node/types';

/**
 * project location the users import
 */
export type ProjectLocation = 'localhost' | 'git'

/**
 * node data object type in file-tree-view
 */
export type FFNode = TNode

/**
 * ff node type - folder/file
 */
export type FFNodeType = 'folder' | 'file'

/**
 * tree type in file-tree-view
 */
export type FFTree = {
  [uid: TUid]: FFNode,
}

/**
 * cmdk reference types
 */
export type TCmdkReference = {
  "Name": string,
  "Icon": string,
  "Description": string,
  "Keyboard Shortcut": string | TCmdk,
  "Group": string,
  "Context"?: string | TCmdkContext,
}

export type TCmdk = {
  cmd: boolean,
  shift: boolean,
  alt: boolean,
  key: string,
  click: boolean,
}

export type TCmdkContextScope = "all" | "file" | "html"

export type TCmdkContext = {
  [scope in TCmdkContextScope]: boolean
}

export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference,
}

export type CmdkData = {
  [groupName: string]: TCmdkReference[],
}

export type TOS = 'Windows' | 'Mac' | 'Linux' | 'Unix'