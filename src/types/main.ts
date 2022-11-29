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