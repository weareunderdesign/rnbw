import { useCallback, useEffect, useMemo, useRef } from "react";

import { debounce } from "lodash";

import { TreeViewData } from "@_components/common/treeView/types";
import { RootNodeUid, ShortDelay } from "@_constants/main";
import { _path } from "@_node/file";
import { TNode, TNodeUid } from "@_node/types";
import { scrollToElement } from "@_pages/main/helper";
import { useAppState } from "@_redux/useAppState";
import { addClass, generateQuerySelector, removeClass } from "@_services/main";

export const useSync = () => {
  const { fileTree, fFocusedItem: focusedItem, hoveredFileUid } = useAppState();

  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(hoveredFileUid);
  useEffect(() => {
    if (hoveredItemRef.current === hoveredFileUid) return;

    const curHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(hoveredItemRef.current)}`,
    );
    curHoveredElement?.setAttribute(
      "class",
      removeClass(curHoveredElement.getAttribute("class") || "", "outline"),
    );
    const newHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(hoveredFileUid)}`,
    );
    newHoveredElement?.setAttribute(
      "class",
      addClass(newHoveredElement.getAttribute("class") || "", "outline"),
    );

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
