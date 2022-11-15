import { UID } from '@_types/global';

// Main State
export type FFTreeViewState = {
  focusedItem: UID,
  expandedItems: UID[],
  selectedItems: UID[],
}