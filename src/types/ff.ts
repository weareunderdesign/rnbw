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
 * node data object type in file-tree-view
 */
export type FFNode = TNode

/**
 * tree type in file-tree-view
 */
export type FFTree = {
  [uid: TUid]: FFNode,
}