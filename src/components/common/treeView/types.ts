import {
  TreeItem,
  TreeRenderProps,
} from 'react-complex-tree';

import { TUid } from '@_node/types';

export type TreeViewProps = {
  width: string,
  height: string,
  data: TreeViewData,

  renderers: TreeRenderProps,

  focusedItem: TUid,
  expandedItems: TUid[],
  selectedItems: TUid[],

  cb_focusNode: (payload: TUid) => void,
  cb_expandNode: (payload: TUid) => void,
  cb_collapseNode: (payload: TUid) => void,
  cb_selectNode: (payload: TUid[]) => void,

  cb_readNode?: (payload: TUid) => void,

  cb_renameNode: (uid: TUid, name: string) => void,
  cb_dropNode: (uids: TUid[], targetTUid: TUid) => void,
}

export type TreeViewData = {
  [uid: string]: TreeItem,
}