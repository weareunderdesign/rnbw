import {
  TreeItem,
  TreeRenderProps,
} from 'react-complex-tree';

import {
  NAME,
  UID,
} from '@_types/global';

export type TreeViewProps = {
  width: string,
  height: string,
  data: TreeViewData,

  renderers: TreeRenderProps,

  focusedItem: UID,
  expandedItems: UID[],
  selectedItems: UID[],

  cb_focusNode: (payload: UID) => void,
  cb_expandNode: (payload: UID) => void,
  cb_collapseNode: (payload: UID) => void,
  cb_selectNode: (payload: UID[]) => void,

  cb_readNode?: (payload: UID) => void,

  cb_renameNode: (uid: UID, name: NAME) => void,
  cb_dropNode: (uids: UID[], targetUID: UID) => void,
}

export type TreeViewData = {
  [uid: string]: TreeItem,
}