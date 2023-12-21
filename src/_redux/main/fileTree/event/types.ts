export type TFileEventReducerState = {
  fileAction: TFileAction;
};

export type TFileAction = { action: TFileActionType } & (
  | {
      action: Extract<TFileActionType, "create">;
      payload: {
        path: string;
      };
    }
  | {
      action: Extract<TFileActionType, "rename">;
      payload: {
        orgPath: string;
        newPath: string;
      };
    }
  | {
      action: null;
      payload?: never;
    }
);
export type TFileActionType =
  | "create"
  | "remove"
  | "move"
  | "rename"
  | "duplicate"
  | "cut"
  | "copy"
  | null;
