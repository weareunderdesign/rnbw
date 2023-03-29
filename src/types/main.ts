import {
  THtmlPageSettings,
  TNodeTreeData,
  TNodeUid,
} from '@_node/index';

export type TFileSystemType = 'local'
export type TWorkspace = {
  name: string,
  projects: TProject[],
}
export type TProject = {
  context: TFileSystemType,
  files: TNodeTreeData,
}
export type TFile = {
  uid: TNodeUid,
  content: string,
}
export type TFileType = 'html' | 'unknown'
export type TFileInfo = THtmlPageSettings | null | undefined
export type TSession = {
  'project-context': TFileSystemType,
  'project-root-folder-handler': FileSystemHandle,
}
export type TEvent = {
  type: 'add-node' | 'remove-node' | 'move-node' | 'duplicate-node' | 'copy-node' | 'code-change',
  param: any[],
} | null
export type TCodeChange = {
  uid: TNodeUid,
  content: string,
}
export type TFileNodeType = '*folder' | 'html' | ''
export type TFileAction = {
  type: TFileActionType,
  param1?: any,
  param2?: any,
}
export type TFileActionType = 'create' | 'delete' | 'move' | 'rename' | 'duplicate' | 'cut' | 'copy' | null
export type TPanelContext = 'file' | 'node' | 'settings' | 'stage' | 'code' | 'cmdk' | 'unknown'
export type TClipboardData = {
  panel: TPanelContext,
  type: 'cut' | 'copy' | null,
  uids: TNodeUid[],
}
export type TCmdkReference = {
  "Featured"?: boolean,
  "Name": string,
  "Icon": string,
  "Description": string,
  "Keyboard Shortcut": string | TCmdkKeyMap,
  "Group": string,
  "Context"?: string | TCmdkContext,
}
export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference,
}
export type TCmdkKeyMap = {
  cmd: boolean,
  shift: boolean,
  alt: boolean,
  key: string,
  click: boolean,
}
export type TCmdkContextScope = "all" | "file" | "html"
export type TCmdkContext = {
  [scope in TCmdkContextScope]: boolean
}
export type TCmdkGroupData = {
  [groupName: string]: TCmdkReference[],
}