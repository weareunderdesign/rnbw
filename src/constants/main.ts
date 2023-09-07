import { TNodeUid } from "@_node/index";

export const HistoryStoreLimit: number = 1000000;
export const CodeViewSyncDelay: number = 4 * 1000;
export const RootNodeUid: TNodeUid = "ROOT";
export const NodeUidSplitter: string = "?";
export const RainbowAppName = "rnbw";
export const NodeInAppAttribName: string = "data-rnbwdev-rnbw-node";
export const TmpNodeUid = "tmp:node:uid";
export const DefaultTabSize: number = 2;
export const HmsUndoActionType: string = "main/undo";
export const HmsRedoActionType: string = "main/redo";
export const HmsClearActionType: string = "main/clear";
export const ParsableFileTypes: {
  [fileType: string]: boolean;
} = {
  ".html": true,
};
export const LogAllow: boolean = true;
export const AddActionPrefix = "AddAction";
export const AddFileActionPrefix = `${AddActionPrefix}-File`;
export const AddNodeActionPrefix = `${AddActionPrefix}-Node`;
export const DefaultProjectPath = "/untitled";
export const StagePreviewPathPrefix = "rnbw-stage-preview-";
export const RecentProjectCount = 10;
