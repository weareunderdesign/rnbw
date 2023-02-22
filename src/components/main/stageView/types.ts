import { TNodeUid } from '@_node/types';

export type StageViewProps = {}

export type StageViewContextType = {
  setFocusedItem: (uid: TNodeUid) => void,
}