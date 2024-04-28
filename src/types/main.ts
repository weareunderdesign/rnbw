import { TProjectContext } from "@_redux/main/fileTree";
import { TFilesReference, THtmlElementsReference } from "@rnbws/rfrncs.design";

export type TSession = {
  context: TProjectContext;
  name: string;
  handler: FileSystemDirectoryHandle | null;
}[];
export type TFileNodeType = "*folder" | "html" | "";

// file reference
export type TFilesReferenceData = {
  [name: string]: TFilesReference;
};

// html reference
export type THtmlReferenceData = {
  elements: THtmlElementsReferenceData;
};
export type THtmlElementsReferenceData = {
  [tag: string]: THtmlElementsReference;
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
