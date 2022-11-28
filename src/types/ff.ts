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
 * context type for main page
 */
export type FFContextType = {
  ffHandlers: FFHandlers,
  setFFHandlers: (handlers: { [uid: TUid]: FileSystemHandle }) => void,
  unsetFFHandlers: (uids: TUid[]) => void,
}

/**
 * ff handler collection
 */
export type FFHandlers = { [key: TUid]: FileSystemHandle }