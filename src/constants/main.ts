export const RootNodeUid = "ROOT";
export const DefaultProjectPath = "/untitled";

export const StagePreviewPathPrefix = "rnbw-stage-preview-";
export const CodeViewSyncDelay = 500;
export const CodeViewSyncDelay_Long = 1 * 1000;

export const ParsableFileTypes: {
  [fileType: string]: true;
} = {
  html: true,
};
export const RednerableFileTypes: {
  [fileType: string]: true;
} = {
  html: true,
};

export const AddActionPrefix = "AddAction";
export const AddFileActionPrefix = `${AddActionPrefix}-File`;
export const AddNodeActionPrefix = `${AddActionPrefix}-Node`;

export const RenameActionPrefix = "RenameAction";
export const RenameFileActionPrefix = `${RenameActionPrefix}-File`;
export const RenameNodeActionPrefix = `${RenameActionPrefix}-Node`;

export const DefaultTabSize: number = 2;
export const RecentProjectCount = 10;

export const NodeUidSplitter: string = "?";

export const TmpNodeUid = "tmp:node:uid";
