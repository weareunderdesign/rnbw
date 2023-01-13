import { THtmlReferenceData } from '@_node/html';
import {
  TFileType,
  TTree,
  TUid,
} from '@_node/types';
import {
  FFTree,
  ProjectLocation,
  TCmdkReferenceData,
} from '@_types/main';

// ---------------- main redux ----------------
/**
 * main page redux state
 */
export type MainState = {
  actionGroupIndex: number,
  global: {
    project: Project,
    currentFile: OpenedFile,
    action: FFAction,
  },
  ff: FFTreeViewState,
  fn: FNTreeViewState,
}

/**
 * project
 */
export type Project = {
  location: ProjectLocation,
  path: string,
}

/**
 * opened file
 */
export type OpenedFile = {
  uid: TUid,
  name: string,
  type: TFileType,
  content: string,
  saved: boolean,
}

/**
 * ff action (create, delete, move, rename, duplicate)
 */
export type FFAction = {
  name: 'create' | 'delete' | 'move' | 'rename' | 'duplicate' | 'cut' | 'copy' | null,
  param1?: any,
  param2?: any,
}

/**
 * ff tree view state
 */
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

/**
 * fn tree view state
 */
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

// update ff tree view state payload type - delete / convert from $a to $b
export type UpdateFFTreeViewStatePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}
// ---------------- main redux ----------------

// ---------------- main context ----------------
/**
 * context type for main page
 */
export type MainContextType = {
  // groupping action
  addRunningActions: (actionNames: string[]) => void,
  removeRunningActions: (actionNames: string[], effect?: boolean) => void,

  // file tree view
  ffHoveredItem: TUid,
  setFFHoveredItem: (uid: TUid) => void,

  ffHandlers: FFHandlers,
  ffTree: FFTree,
  setFFTree: (tree: FFTree) => void,
  updateFF: (deletedUids: { [uid: TUid]: boolean }, nodes: FFTree, handlers: { [uid: TUid]: FileSystemHandle }) => void,

  // node tree view
  fnHoveredItem: TUid,
  setFNHoveredItem: (uid: TUid) => void,

  nodeTree: TTree,
  setNodeTree: (tree: TTree) => void,

  validNodeTree: TTree,
  setValidNodeTree: (tree: TTree) => void,

  // update opt
  updateOpt: UpdateOptions,
  setUpdateOpt: (opt: UpdateOptions) => void,

  // ff hms
  isHms: boolean | null,
  setIsHms: (is: boolean | null) => void,

  ffAction: FFAction,
  setFFAction: (action: FFAction) => void,

  // cmdk
  command: Command,
  setCommand: (command: Command) => void,

  // global
  pending: boolean,
  setPending: (pending: boolean) => void,

  messages: Message[],
  addMessage: (message: Message) => void,
  removeMessage: (index: number) => void,

  // reference
  htmlReferenceData: THtmlReferenceData,
  cmdkReferenceData: TCmdkReferenceData,

  // active panel/clipboard
  activePanel: TPanel,
  setActivePanel: (panel: TPanel) => void,

  clipboardData: TClipboardData,
  setClipboardData: (data: TClipboardData) => void,
}

/**
 * ff handler collection
 */
export type FFHandlers = { [key: TUid]: FileSystemHandle }

/**
 * update opts
 */
export type UpdateOptions = {
  parse: boolean | null, // true if should parse, false if serialize
  from: 'fs' | 'code' | 'node' | 'stage' | 'settings' | 'styles' | 'processor' | 'hms' | null,
  isHms?: boolean,
}

/**
 * command
 */
export type Command = {
  action: string,
  changed: boolean,
}

/**
 * message-type
 */
export type MessageType = 'warning' | 'error' | 'info' | 'success'

/**
 * message
 */
export type Message = {
  type: MessageType,
  message: string,
}

/**
 * panel
 */
export type TPanel = 'file' | 'node' | 'stage' | 'code' | 'other'

/**
 * clipboard data type
 */
export type TClipboardData = {
  panel: TPanel,
  type: 'cut' | 'copy' | null,
  uids: TUid[],
}
// ---------------- main context ----------------