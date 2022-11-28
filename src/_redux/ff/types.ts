import { TUid } from '@_node/types';

// Main State
export type FFTreeViewState = {
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

/* update ff node - delete / convert from $a to $b */
export type UpdateFFNodePayload = {
  deletedUids?: TUid[],
  convertedUids?: [TUid, TUid][],
}