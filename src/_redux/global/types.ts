import {
  FFNodeActionReadPayloadRes,
  FFNodeActionUpdatePayloadRes,
  FFObject,
  FileContent,
  FileExtension,
  Project,
  Workspace,
} from '@_types/ff';
import {
  ErrorRes,
  UID,
} from '@_types/global';

// Main State
export type GlobalState = {
  workspace: Workspace,
  projects: {
    [uid: string]: FFObject,
  },
  currentFile: {
    uid: UID,
    type: FileExtension,
    content: FileContent,
  },
  error: ErrorRes,
}

// Add/Remove Project Payload
export type AddProjectPayload = Project

// AddFFObject Payload
export type AddFFObjectPayload = FFObject[]

// RemoveFFObject Payload
export type RemoveFFObjectPayload = UID[]

// SetCurrentFile Payload
export type SetCurrentFilePayload = FFNodeActionReadPayloadRes | FFNodeActionUpdatePayloadRes