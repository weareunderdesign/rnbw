import {
  THtmlPageSettings,
  TNodeTreeData,
  TNodeUid,
} from '@_node/index';

/**
 * file-system type
 */
export type TFileSystemType = 'local'
/**
 * file type
 */
export type TFileType = 'html' | 'unknown'
/**
 * workspace
 */
export type TWorkspace = {
  name: string,
  projects: TProject[],
}
/**
 * project
 */
export type TProject = {
  context: TFileSystemType,
  files: TNodeTreeData,
}
/**
 * file
 */
export type TFile = {
  uid: TNodeUid,
  content: string,
}
export type TFileInfo = THtmlPageSettings | null | undefined
/**
 * session
 */
export type TSession = {
  'project-context': TFileSystemType,
  'project-root-folder-handler': FileSystemHandle,
}
export type TEvent = {
  type: 'add-node' | 'remove-node' | 'move-node' | 'duplicate-node' | 'copy-node' | 'code-change',
  param: any[],
} | null
/**
 * file tree view node type
 */
export type TFileNodeType = '*folder' | 'html' | ''
/**
 * file tree view - node action
 */
export type TFileAction = {
  type: TFileActionType,
  param1?: any,
  param2?: any,
}
/**
 * file tree view - node action type
 */
export type TFileActionType = 'create' | 'delete' | 'move' | 'rename' | 'duplicate' | 'cut' | 'copy' | null
/**
 * panel context
 */
export type TPanelContext = 'file' | 'node' | 'settings' | 'stage' | 'code' | 'cmdk' | 'unknown'
/**
 * clipboard data type
 */
export type TClipboardData = {
  panel: TPanelContext,
  type: 'cut' | 'copy' | null,
  uids: TNodeUid[],
}
/**
 * cmdk reference
 */
export type TCmdkReference = {
  "Featured"?: boolean,
  "Name": string,
  "Icon": string,
  "Description": string,
  "Keyboard Shortcut": string | TCmdkKeyMap,
  "Group": string,
  "Context"?: string | TCmdkContext,
}
/**
 * cmdk reference data
 */
export type TCmdkReferenceData = {
  [cmdk: string]: TCmdkReference,
}
/**
 * command key map
 */
export type TCmdkKeyMap = {
  cmd: boolean,
  shift: boolean,
  alt: boolean,
  key: string,
  click: boolean,
}
/**
 * cmdk context scope
 */
export type TCmdkContextScope = "all" | "file" | "html"
/**
 * cmdk context
 */
export type TCmdkContext = {
  [scope in TCmdkContextScope]: boolean
}
/**
 * groupped cmdk data
 */
export type TCmdkGroupData = {
  [groupName: string]: TCmdkReference[],
}
export type TCodeChange = {
  uid: TNodeUid,
  content: string,
}