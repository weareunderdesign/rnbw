import {
  TFileType,
  TUid,
} from '@_node/types';
import { FFTree } from '@_types/ff';

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