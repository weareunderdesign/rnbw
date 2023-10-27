export type TCmdkReducerState = {
  cmdkOpen: boolean;
  cmdkPages: string[];
  currentCmdkPage: string | null;

  currentCommand: TCommand;
};

export type TCommand = {
  action: string;
  description?: string;
} | null;
