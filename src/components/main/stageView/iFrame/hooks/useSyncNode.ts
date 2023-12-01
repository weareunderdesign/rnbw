import { useEffect, useRef } from "react";

import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { TNodeTreeData, TNodeUid } from "@_node/types";

import { useAppState } from "@_redux/useAppState";

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
    let curHoveredElement = contentRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${hoveredItemRef.current}"]`,
    );
    curHoveredElement?.removeAttribute("rnbwdev-rnbw-element-hover");

    // mark new hovered item
    let newHoveredElement = contentRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${hoveredNodeUid}"]`,
    );
    newHoveredElement?.setAttribute("rnbwdev-rnbw-element-hover", "");

    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // focusedItem -> scroll to
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const newFocusedElement =
      contentRef?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${focusedItem}"]`,
      );

    true
      ? newFocusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "smooth",
        })
      : setTimeout(
          () =>
            newFocusedElement?.scrollIntoView({
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
    selectedItemsRef.current.map((uid) => {
      // for the elements which are created by js. (ex: Web Component)
      let curselectedElement =
        contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
      /* const isValid: null | string = curselectedElement?.firstElementChild
          ? curselectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
          : "";
        isValid === null
          ? (curselectedElement = curselectedElement?.firstElementChild)
          : null; */
      curselectedElement?.removeAttribute("rnbwdev-rnbw-element-select");
    });
    // mark new selected items
    selectedItems.map((uid) => {
      // for the elements which are created by js. (ex: Web Component)
      let newSelectedElement =
        contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
      /* const isValid: null | string = newSelectedElement?.firstElementChild
          ? newSelectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
          : "";
        isValid === null
          ? (newSelectedElement = newSelectedElement?.firstElementChild)
          : null; */
      newSelectedElement?.setAttribute("rnbwdev-rnbw-element-select", "");
    });

    selectedItemsRef.current = [...selectedItems];
    console.log(selectedItemsRef.current);
  }, [selectedItems]);

  return { nodeTreeRef, hoveredItemRef, focusedItemRef, selectedItemsRef };
};
