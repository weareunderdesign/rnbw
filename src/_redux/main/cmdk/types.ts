export type TCmdkReducerState = {
  cmdkOpen: boolean;
  cmdkPages: string[];
  currentCmdkPage: string | null;

  currentCommand: TCommand | null;
};

export type TCommand = {
  action: string;
  description?: string;
};
