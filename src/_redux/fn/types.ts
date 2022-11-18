import { TUid } from '@_node/types';

// Main State
export type FNTreeViewState = {
  focusedItem: TUid,
  expandedItems: TUid[],
  selectedItems: TUid[],
}