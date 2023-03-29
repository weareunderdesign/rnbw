import { TNodeUid } from '@_node/index';

export const HistoryStoreLimit: number = 1000000
export const CodeViewSyncDelay: number = 2 * 1000
export const RootNodeUid: TNodeUid = 'ROOT'
export const NodeUidSplitter: string = '?'
export const RainbowAppName = 'rnbw'
export const NodeInAppAttribName: string = 'data-rnbwdev-rnbw-node'
export const TmpNodeUid = 'tmp:node:uid'
export const DefaultTabSize: number = 2
export const HmsUndoActionType: string = 'main/undo'
export const HmsRedoActionType: string = 'main/redo'
export const HmsClearActionType: string = 'main/clear'
export const ParsableFileTypes: {
  [fileType: string]: boolean,
} = {
  '.html': true,
}
export const LogAllow: boolean = true
export const AddNodeActionPrefix = 'AddNode'