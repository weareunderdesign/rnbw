import {
  DraggingPosition,
  TreeItem,
  TreeItemIndex,
  TreeRenderProps,
} from 'react-complex-tree';

import { TNodeUid } from '@_node/types';

export type TreeViewProps = {
  width: string,
  height: string,

  info: {
    id: string,
    label?: string,
  }

  data: TreeViewData,
  focusedItem: TNodeUid,
  expandedItems: TNodeUid[],
  selectedItems: TNodeUid[],

  renderers?: TreeRenderProps,

  props: {
    [prop: string]: any,
  },

  callbacks: {
    onStartRenamingItem?: ((item: TreeItem, treeId: string) => void) | undefined,
    onAbortRenamingItem?: ((item: TreeItem, treeId: string) => void) | undefined,
    onRenameItem?: ((item: TreeItem, name: string, treeId: string) => void) | undefined,

    onSelectItems?: ((items: TreeItemIndex[], treeId: string) => void) | undefined,
    onFocusItem?: ((item: TreeItem, treeId: string) => void) | undefined,
    onExpandItem?: ((item: TreeItem, treeId: string) => void) | undefined,
    onCollapseItem?: ((item: TreeItem, treeId: string) => void) | undefined,

    onDrop?: ((items: TreeItem[], target: DraggingPosition) => void) | undefined,

    onPrimaryAction?: ((items: TreeItem, treeId: string) => void) | undefined,
  },
}

export type TreeViewData = {
  [uid: string]: TreeItem,
}