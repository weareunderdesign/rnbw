import { useCallback, useEffect, useMemo, useRef } from "react";
import { TreeViewData } from "@src/common/treeView/types";
import { RootNodeUid, ShortDelay } from "@src/indexTSX";
import { TNode, TNodeUid } from "@_node/types";
import { debounce, scrollToElement } from "@src/helper";
import { useAppState } from "@_redux/useAppState";
import { addClass, generateQuerySelector, removeClass } from "@_services/main";

export const useSync = () => {
  const { fileTree, fFocusedItem: focusedItem, hoveredFileUid } = useAppState();

  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(hoveredFileUid);
  useEffect(() => {
    if (hoveredItemRef.current === hoveredFileUid) return;

    const curHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(hoveredItemRef.current)}`
    ) as HTMLElement | null;

    if (curHoveredElement) {
      curHoveredElement.style.removeProperty('outline-width');
      curHoveredElement.style.removeProperty('outline-style');
      curHoveredElement.style.removeProperty('outline-offset');
    }

    const newHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(hoveredFileUid)}`
    ) as HTMLElement | null;

    if (newHoveredElement) {
      newHoveredElement.style.outlineWidth = '1px';
      newHoveredElement.style.outlineStyle = 'solid';
      newHoveredElement.style.outlineOffset = '-1px';
    }

    hoveredItemRef.current = hoveredFileUid;
  }, [hoveredFileUid]);

  // scroll to the focused item
  const debouncedScrollToElement = useCallback(
    debounce(scrollToElement, ShortDelay),
    [],
  );
  const focusedItemRef = useRef(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(focusedItem)}`,
    );
    focusedElement && debouncedScrollToElement(focusedElement, "auto");

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  // build fileTreeViewData
  const fileTreeViewData = useMemo(() => {
    const data: TreeViewData = {};
    for (const uid in fileTree) {
      const node: TNode = fileTree[uid];
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      };
    }
    return data;
  }, [fileTree]);

  return { focusedItemRef, fileTreeViewData };
};
