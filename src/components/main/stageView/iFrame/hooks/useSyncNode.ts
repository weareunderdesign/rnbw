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

export const useSyncNode = (iframeRefState: HTMLIFrameElement | null) => {
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

  // hoveredNodeUid -> stageView
  const hoveredItemRef = useRef<TNodeUid>(hoveredNodeUid);
  useEffect(() => {
    if (hoveredItemRef.current === hoveredNodeUid) return;

    unmarkHoverdElement(iframeRefState, hoveredItemRef.current);
    markHoverdElement(iframeRefState, hoveredNodeUid);
    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // focusedItem -> scrollTo
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement =
      iframeRefState?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${focusedItem}"]`,
      );
    setTimeout(
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

  // selectedItems -> stageView
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

    unmarkSelectedElements(iframeRefState, selectedItemsRef.current);
    markSelectedElements(iframeRefState, selectedItems);
    selectedItemsRef.current = [...selectedItems];
  }, [selectedItems]);

  return { nodeTreeRef, hoveredItemRef, focusedItemRef, selectedItemsRef };
};
