export type TCmdkReducerState = {
  cmdkOpen: boolean;
  cmdkPages: string[];
  currentCmdkPage: string;

  cmdkSearchContent: string;
  currentCommand: TCommand | null;
};

export type TCommand = {
  action: string;
  description?: string;
};
