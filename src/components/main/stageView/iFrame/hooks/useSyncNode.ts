import { useEffect, useRef } from "react";

import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { TNodeTreeData, TNodeUid } from "@_node/types";

import { useAppState } from "@_redux/useAppState";
import {
  markHoverdElement,
  markSelectedElements,
  unmarkHoverdElement,
  unmarkSelectedElements,
} from "../helpers";

export const useSyncNode = (contentRef: HTMLIFrameElement | null) => {
  const {
    nodeTree,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
    hoveredNodeUid,
  } = useAppState();

  const nodeTreeRef = useRef<TNodeTreeData>(nodeTree);
  useEffect(() => {
    nodeTreeRef.current = structuredClone(nodeTree);
  }, [nodeTree]);

  // hoveredNodeUid -> stage-view
  const hoveredItemRef = useRef<TNodeUid>(hoveredNodeUid);
  useEffect(() => {
    if (hoveredItemRef.current === hoveredNodeUid) return;

    // remove current hovered effect
    unmarkHoverdElement(contentRef, hoveredItemRef.current);
    // mark new hovered item
    markHoverdElement(contentRef, hoveredNodeUid);

    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // focusedItem -> scroll to
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = contentRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${focusedItem}"]`,
    );

    true
      ? focusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "smooth",
        })
      : setTimeout(
          () =>
            focusedElement?.scrollIntoView({
              block: "nearest",
              inline: "start",
              behavior: "smooth",
            }),
          50,
        );

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  // mark selected items
  const selectedItemsRef = useRef<TNodeUid[]>(selectedItems);
  useEffect(() => {
    // check if it's a new state
    if (selectedItemsRef.current.length === selectedItems.length) {
      let same = true;
      for (
        let index = 0, len = selectedItemsRef.current.length;
        index < len;
        ++index
      ) {
        if (selectedItemsRef.current[index] !== selectedItems[index]) {
          same = false;
          break;
        }
      }
      if (same) return;
    }

    // remove original selected effect
    unmarkSelectedElements(contentRef, selectedItemsRef.current);
    // mark new selected items
    markSelectedElements(contentRef, selectedItems);

    selectedItemsRef.current = [...selectedItems];
  }, [selectedItems]);

  return { nodeTreeRef, hoveredItemRef, focusedItemRef, selectedItemsRef };
};
