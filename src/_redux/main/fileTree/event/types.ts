export type TFileEventReducerState = {
  fileAction: TFileAction;
};

export type TFileAction = {
  type: TFileActionType;
  param1?: any;
  param2?: any;
};
export type TFileActionType =
  | "create"
  | "delete"
  | "move"
  | "rename"
  | "duplicate"
  | "cut"
  | "copy"
  | null;
