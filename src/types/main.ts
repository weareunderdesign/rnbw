import {
  THtmlPageSettings,
  TNodeUid,
} from '@_node/index';
import { TProjectContext } from '@_redux/main/fileTree';

export type TFileInfo = THtmlPageSettings | null | undefined;
export type TSession = {
  "recent-project-context": TProjectContext[];
  "recent-project-name": string[];
  "recent-project-handler": (FileSystemDirectoryHandle | null)[];
};
export type TCodeChange = {
  uid: TNodeUid;
  content: string;
};
export type TFileNodeType = "*folder" | "html" | "";

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
