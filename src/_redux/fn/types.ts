import { TUid } from '@_node/types';

// Main State
export type FNTreeViewState = {
  focusedItem: TUid,
  expandedItems: TUid[],
  expandedItemsObj: {
    [uid: TUid]: boolean,
  },
  selectedItems: TUid[],
  selectedItemsObj: {
    [uid: TUid]: boolean,
  },
}

/* update fn node - convert from $a to $b */
export type UpdateFNNodePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}