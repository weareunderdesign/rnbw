import { UID } from '@gtypes/global';

// Main State
export type FNTreeViewState = {
  focusedItem: UID,
  expandedItems: UID[],
  selectedItems: UID[],
}