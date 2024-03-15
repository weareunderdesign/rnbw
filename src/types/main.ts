import { TProjectContext } from "@_redux/main/fileTree";

export type TSession = {
  "recent-project-context": TProjectContext[];
  "recent-project-name": string[];
  "recent-project-handler": (FileSystemDirectoryHandle | null)[];
};
export type TFileNodeType = "*folder" | "html" | "";

// file reference
export type TFilesReferenceData = {
  [name: string]: TFilesReference;
};
export type TFilesReference = {
  Name: string;
  Extension: string;
  Type: string;
  Icon: string;
  Description: string;
  Featured: string;
};

// html reference
export type THtmlReferenceData = {
  elements: THtmlElementsReferenceData;
};
export type THtmlElementsReferenceData = {
  [tag: string]: THtmlElementsReference;
};
export type THtmlElementsReference = {
  Featured: string;
  Tag: string;
  Name: string;
  Type: string;
  Contain: string;
  Description: string;
  Icon: string;
  Content: string;
  Attributes: string;
  "Cover Image": string;
};

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
