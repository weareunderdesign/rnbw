import { TNodeUid } from '@_node/index';

/**
 * local file system watch interval - by mesc
 */
export const LocalFileSystemWatchInterval: number = 100

/**
 * limit size of history store
 */
export const HistoryStoreLimit: number = 1000000

/**
 * code-view sync debounce time - by msec
 */
export const CodeViewSyncDelay: number = 1 * 1000

/**
 * file auto-save debounce time - by msec
 */
export const FileAutoSaveInterval: number = 3 * 1000

/**
 * root node uid in node-tree-view
 */
export const RootNodeUid: TNodeUid = 'ROOT'

/**
 * splitter character which links node uids
 */
export const NodeUidSplitter: string = '?'

/**
 * node uid splitter character regexp for replace method
 */
export const NodeUidSplitterRegExp: RegExp = new RegExp(/\?/g)

/**
 * in-app node class name
 */
export const NodeInAppClassName: string = 'rnbwdev-rnbw-node-9307667676537437466677115'

/**
 * tmp node uid when creating a new file-node
 */
export const TmpNodeUid = 'tmp:node:uid'

/**
 * default tab size in code view
 */
export const DefaultTabSize: number = 2

/**
 * main page hms undo action type
 */
export const HmsUndoActionType: string = 'main/undo'

/**
 * main page hms redo action type
 */
export const HmsRedoActionType: string = 'main/redo'

/**
 * main page hms clear-history action type
 */
export const HmsClearActionType: string = 'main/clear'

/**
 * parsable file types
 */
export const ParsableFileTypes: {
  [fileType: string]: boolean,
} = {
  html: true,
}

/**
 * log allowing flag
 */
export const LogAllow: boolean = true

/**
 * auto-save flag on code view
 */
export const AutoSave: boolean = false