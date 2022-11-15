import { UID } from '@_types/global';

// Main State
export type FNTreeViewState = {
  focusedItem: UID,
  expandedItems: UID[],
  selectedItems: UID[],
}