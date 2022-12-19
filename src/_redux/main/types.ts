import {
  TFileType,
  TTree,
  TUid,
} from '@_node/types';
import {
  FFNode,
  FFTree,
} from '@_types/main';

// Main State
export type MainState = {
  actionGroupIndex: number,
  global: {
    workspace: FFTree,
    currentFile: OpenedFile,
    openedFiles: OpenedFile[],
    pending: boolean,
    messages: Message[],
  },
  ff: FFTreeViewState,
  fn: FNTreeViewState,
}

/* Error Type */
export type MessageType = 'warning' | 'error' | 'info' | 'success'
export type Message = {
  type: MessageType,
  message: string,
}

// open file type
export type OpenedFile = {
  uid: TUid,
  name: string,
  type: TFileType,
  content: string,
  saved: boolean,
}

// ff tree view state type
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

// update ff tree view payload type - delete / add nodes to workspace
export type UpdateFFTreeViewPayload = {
  deletedUids?: TUid[],
  nodes?: FFNode[],
}

// update ff tree view state payload type - delete / convert from $a to $b
export type UpdateFFTreeViewStatePayload = {
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
export type UpdateFNTreeViewStatePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}

/* Context */
/**
 * context type for main page
 */
export type MainContextType = {
  // file tree view
  ffHoveredItem: TUid,
  setFFHoveredItem: (uid: TUid) => void,

  ffHandlers: FFHandlers,
  setFFHandlers: (deletedUids: TUid[], handlers: { [uid: TUid]: FileSystemHandle }) => void,

  // node tree view
  fnHoveredItem: TUid,
  setFNHoveredItem: (uid: TUid) => void,

  nodeTree: TTree,
  setNodeTree: (tree: TTree) => void,

  validNodeTree: TTree,
  setValidNodeTree: (tree: TTree) => void,

  // cmdk
  command: Command,
  setCommand: (command: Command) => void,
}

/**
 * Cmdk
 */
export type Command = {
  action: string,
  changed: boolean,
}

/**,
 * ff handler collection
 */
export type FFHandlers = { [key: TUid]: FileSystemHandle }