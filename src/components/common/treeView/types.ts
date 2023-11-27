import {
  DraggingPosition,
  TreeItem,
  TreeItemIndex,
  TreeRenderProps,
} from "react-complex-tree";

import { TNodeUid } from "@_node/types";

export type TreeViewProps = {
  width: string;
  height: string;

  info: {
    id: string;
    label?: string;
  };

  data: TreeViewData;
  focusedItem: TNodeUid;
  expandedItems: TNodeUid[];
  selectedItems: TNodeUid[];

  renderers?: TreeRenderProps;

  props: {
    [prop: string]: any;
  };

  callbacks: {
    onStartRenamingItem?: (item: TreeItem, treeId: string) => void;
    onAbortRenamingItem?: (item: TreeItem, treeId: string) => void;
    onRenameItem?: (item: TreeItem, name: string, treeId: string) => void;

    onSelectItems?: (items: TreeItemIndex[], treeId: string) => void;
    onFocusItem?: (item: TreeItem, treeId: string) => void;
    onExpandItem?: (item: TreeItem, treeId: string) => void;
    onCollapseItem?: (item: TreeItem, treeId: string) => void;

    onDrop?: (items: TreeItem[], target: DraggingPosition) => void;

    onPrimaryAction?: (items: TreeItem, treeId: string) => void;
  };
};
export type TreeViewData = {
  [uid: string]: TreeItem;
};
