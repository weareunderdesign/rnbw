import {
  TFileType,
  TUid,
} from '@_node/types';
import { FFTree } from '@_types/main';
import React from 'react';

/* Error Type */
export type ErrorType = 'warning' | 'error' | 'info' | 'success'
export type _Error = {
  type: ErrorType,
  errorMessage: string,
  error?: any,
}

// global
export type MainState = {
  global: {
    workspace: FFTree,
    currentFile: {
      uid: TUid,
      type: TFileType,
      content: string,
    },
    // currentNode: {
    //   uid: TUid,
    //   settings: {
    //     name: string,
    //     props: 
    //   }
    // },
    pending: boolean,
    error: _Error | null,
  },
  ff: FFTreeViewState,
  fn: FNTreeViewState,
}

// ff
export type FFTreeViewState = {
  focusedItem: TUid,
  expandedItems: TUid[],
  expandedItemsObj: {
    [uid: TUid]: boolean,
  },
  selectedItems: TUid[],
  selectedItemsObj: {
    [uid: TUid]: boolean,
  },
}

/* update ff node - delete / convert from $a to $b */
export type UpdateFFNodePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}

// fn
export type FNTreeViewState = {
  focusedItem: TUid,
  expandedItems: TUid[],
  expandedItemsObj: {
    [uid: TUid]: boolean,
  },
  selectedItems: TUid[],
  selectedItemsObj: {
    [uid: TUid]: boolean,
  },
}

/* update fn node - delete / convert from $a to $b */
export type UpdateFNNodePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}

/* Context */
/**
 * context type for main page
 */
export type MainContextType = {
  ffHandlers: FFHandlers,
  setFFHandlers: (deletedUids: TUid[], handlers: { [uid: TUid]: FileSystemHandle }) => void,
}

/**
 * ff handler collection
 */
export type FFHandlers = { [key: TUid]: FileSystemHandle }