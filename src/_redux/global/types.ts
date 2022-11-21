import {
  TFileType,
  TUid,
} from '@_node/types';
import {
  FFNodeActionReadPayloadRes,
  FFNodeActionUpdatePayloadRes,
  FFTree,
} from '@_types/ff';

// Main State
export type GlobalState = {
  workspace: FFTree,
  currentFile: {
    uid: TUid,
    type: TFileType,
    content: string,
  },
  pending: boolean,
  error: string,
}

// SetCurrentFile Payload
export type SetCurrentFilePayload = FFNodeActionReadPayloadRes | FFNodeActionUpdatePayloadRes