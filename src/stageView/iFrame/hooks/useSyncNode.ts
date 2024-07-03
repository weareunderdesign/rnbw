import { useCallback, useEffect, useMemo, useRef } from "react";

import { ShortDelay } from "@src/indexTSX";
import { StageNodeIdAttr } from "@_api/file/handlers";
import { TNodeTreeData, TNodeUid } from "@_api/types";
import { debounce, getObjKeys, scrollToElement } from "@src/helper";
import { useAppState } from "@_redux/useAppState";

import {
  markHoverdElement,
  markSelectedElements,
  unmarkHoverdElement,
  unmarkSelectedElements,
} from "../helpers";

export const useSyncNode = (iframeRef: HTMLIFrameElement | null) => {
  const {
    nodeTree,
    nFocusedItem: focusedItem,
    nSelectedItemsObj: selectedItemsObj,
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

    unmarkHoverdElement(iframeRef, hoveredItemRef.current);
    markHoverdElement(iframeRef, hoveredNodeUid);
    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // focusedItem -> scrollTo
  const focusedItemRef = useRef<TNodeUid>(focusedItem);

  const debouncedScrollToElement = useCallback(
    debounce(scrollToElement, ShortDelay),
    [],
  );
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = iframeRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${focusedItem}"]`,
    );
    focusedElement && debouncedScrollToElement(focusedElement, "smooth");

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  // selectedItems -> stageView
  const selectedItems = useMemo(
    () => getObjKeys(selectedItemsObj),
    [selectedItemsObj],
  );
  const previousSelectedItemsRef = useRef<TNodeUid[]>(selectedItems);

  useEffect(() => {
    // check if it's a new state
    if (previousSelectedItemsRef.current.length === selectedItems.length) {
      let same = true;
      for (
        let index = 0, len = previousSelectedItemsRef.current.length;
        index < len;
        ++index
      ) {
        if (previousSelectedItemsRef.current[index] !== selectedItems[index]) {
          same = false;
          break;
        }
      }
      if (same) return;
    }

    unmarkSelectedElements(
      iframeRef,
      previousSelectedItemsRef.current,
      nodeTree,
    );
    if (selectedItems.length > 0) {
      markSelectedElements(iframeRef, selectedItems, nodeTree);

      previousSelectedItemsRef.current = [...selectedItems];
    }
  }, [selectedItems]);

  return {
    nodeTreeRef,
    hoveredItemRef,
    focusedItemRef,
    selectedItemsRef: previousSelectedItemsRef,
  };
};
