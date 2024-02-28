// cmdk reference
export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference;
};
export type TCmdkReference = {
  Featured?: boolean;
  Name: string;
  Icon: string;
  Description: string;
  "Keyboard Shortcut": string | TCmdkKeyMap | string[] | TCmdkKeyMap[];
  Group: string;
  Context?: string | TCmdkContext;
};
export type TCmdkKeyMap = {
  cmd: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
  click: boolean;
};
export type TCmdkContext = {
  [scope in TCmdkContextScope]: boolean;
};
export type TCmdkContextScope = "all" | "file" | "html";
export type TCmdkGroupData = {
  [groupName: string]: TCmdkReference[];
};

export type TCmdkReducerState = {
  cmdkOpen: boolean;
  cmdkPages: string[];
  currentCmdkPage: string;

  cmdkSearchContent: string;
  currentCommand: TCommand | null;
  cmdkReferenceData: TCmdkReferenceData;
};

export type TCommand = {
  action: string;
  description?: string;
};
