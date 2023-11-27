import { useContext } from "react";

import { DraggingPosition, TreeItem, TreeItemIndex } from "react-complex-tree";

import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";

import { useNodeViewState } from "./useNodeViewState";
import { useNodeActionsHandlers } from "./useNodeActionsHandlers";
import { useAppState } from "@_redux/useAppState";
import { getValidNodeUids } from "@_node/helpers";

export const useNodeTreeCallback = (
  focusItemValue: TNodeUid | null,
  isDragging: boolean,
) => {
  const { validNodeTree } = useAppState();
  const { htmlReferenceData } = useContext(MainContext);

  const { onMove } = useNodeActionsHandlers();
  const { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode } =
    useNodeViewState(focusItemValue);

  const onSelectItems = (items: TreeItemIndex[]) => {
    cb_selectNode(items as TNodeUid[]);
  };
  const onFocusItem = (item: TreeItem) => {
    cb_focusNode(item.index as TNodeUid);
  };
  const onExpandItem = (item: TreeItem) => {
    cb_expandNode(item.index as TNodeUid);
  };
  const onCollapseItem = (item: TreeItem) => {
    cb_collapseNode(item.index as TNodeUid);
  };

  const onDrop = (
    items: TreeItem[],
    target: DraggingPosition & {
      parentItem?: TreeItemIndex;
      targetItem?: TreeItemIndex;
    },
  ) => {
    const isBetween = target.targetType === "between-items";
    const targetUid = (
      target.targetType === "item" ? target.targetItem : target.parentItem
    ) as TNodeUid;
    const position = isBetween ? target.childIndex : 0;

    const validUids = getValidNodeUids(
      validNodeTree,
      items.map((item) => item.data.uid),
      targetUid,
      "html",
      htmlReferenceData,
    );
    if (validUids.length === 0) return;

    if (target.parentItem === "ROOT") return;

    // ************************************************************************
    // below commentted process will be done in getValidNodeUids helper
    // please have a check
    // ************************************************************************
    /* const isTargetHead =
      (target?.parentItem && validNodeTree[target?.parentItem].displayName) ===
        "head" ||
      (target?.targetItem &&
        validNodeTree[target?.targetItem].displayName === "head");
    const headTags = [
      "title",
      "meta",
      "link",
      "script",
      "style",
      "base",
      "noscript",
    ];
    if (isTargetHead) {
      for (const item of items) {
        if (!headTags.includes(item.data.displayName)) {
          return;
        }
      }
    } */

    onMove({
      selectedUids: validUids,
      targetUid: targetUid as TNodeUid,
      isBetween,
      position,
    });

    isDragging = false;
  };

  return {
    onSelectItems,
    onFocusItem,
    onExpandItem,
    onCollapseItem,
    onDrop,
  };
};
