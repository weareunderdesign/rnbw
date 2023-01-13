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
  name: string,
  icon: string,
  description: string,
  keyboardShortcut: TCmdk,
  type: string,
}

export type TCmdk = {
  cmd: boolean,
  shift: boolean,
  alt: boolean,
  key: string,
  click: boolean,
}

export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference,
}