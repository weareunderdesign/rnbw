import { useContext } from "react";

import { DraggingPosition, TreeItem, TreeItemIndex } from "react-complex-tree";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionHandlers } from "./useNodeActionHandlers";
import { useNodeViewState } from "./useNodeViewState";
import { setLastNodesContents } from "@_redux/main/nodeTree";
import { useDispatch } from "react-redux";

export const useNodeTreeCallback = (
  isDragging: React.MutableRefObject<boolean>,
) => {
  const { validNodeTree, htmlReferenceData, lastNodesContents } = useAppState();
  const dispatch = useDispatch();

  const { onMove } = useNodeActionHandlers();
  const { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode } =
    useNodeViewState();

  const onSelectItems = (items: TreeItemIndex[]) => {
    dispatch(setLastNodesContents(validNodeTree[items[0]].sequenceContent));
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

    onMove({
      selectedUids: validUids,
      targetUid: targetUid as TNodeUid,
      isBetween,
      position,
    });

    isDragging.current = false;
  };

  return {
    onSelectItems,
    onFocusItem,
    onExpandItem,
    onCollapseItem,
    onDrop,
  };
};
