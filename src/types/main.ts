import {
  THtmlPageSettings,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from "@_node/index";

export type TProjectContext = "local" | "idb";
export type TWorkspace = {
  name: string;
  projects: TProject[];
};
export type TProject = {
  context: TProjectContext;
  name: string;
  handler: FileSystemDirectoryHandle | null;
  favicon: string | null;
};
export type TFileInfo = THtmlPageSettings | null | undefined;
export type TSession = {
  "recent-project-context": TProjectContext[];
  "recent-project-name": string[];
  "recent-project-handler": (FileSystemDirectoryHandle | null)[];
};
export type TEvent = {
  type:
    | "add-node"
    | "remove-node"
    | "move-node"
    | "duplicate-node"
    | "copy-node"
    | "copy-node-external"
    | "code-change"
    | "group-node"
    | "ungroup-node";
  param: any[];
} | null;
export type TCodeChange = {
  uid: TNodeUid;
  content: string;
};
export type TFileNodeType = "*folder" | "html" | "";

export type TPanelContext =
  | "file"
  | "node"
  | "settings"
  | "stage"
  | "code"
  | "cmdk"
  | "unknown";
export type TClipboardData = {
  panel: TPanelContext;
  type: "cut" | "copy" | null;
  uids: TNodeUid[];
  fileType: "html" | "unknown";
  data: TNode[];
  fileUid: TNodeUid;
  prevNodeTree: TNodeTreeData;
};
export type TCmdkReference = {
  Featured?: boolean;
  Name: string;
  Icon: string;
  Description: string;
  "Keyboard Shortcut": string | TCmdkKeyMap;
  Group: string;
  Context?: string | TCmdkContext;
};
export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference;
};
export type TCmdkKeyMap = {
  cmd: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
  click: boolean;
};
export type TCmdkContextScope = "all" | "file" | "html";
export type TCmdkContext = {
  [scope in TCmdkContextScope]: boolean;
};
export type TCmdkGroupData = {
  [groupName: string]: TCmdkReference[];
};
