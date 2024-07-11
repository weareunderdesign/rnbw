import { useCallback, useEffect, useMemo, useRef } from "react";

import { ShortDelay } from "@src/rnbwTSX";
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

  // hoveredNodeUid -> designView
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

  // selectedItems -> designView
  const selectedItems = useMemo(
    () => getObjKeys(selectedItemsObj),
    [selectedItemsObj],
  );
  const previousSelectedItemsRef = useRef<TNodeUid[]>(selectedItems);

  useEffect(() => {
    // // check if it's a new state

    unmarkSelectedElements(
      iframeRef,
      previousSelectedItemsRef.current,
      nodeTree,
    );
    if (selectedItems.length > 0) {
      //Takes time for the iframe to render the elements so we need to wait a bit
      setTimeout(() => {
        markSelectedElements(iframeRef, selectedItems, nodeTree);

        previousSelectedItemsRef.current = [...selectedItems];
      }, 50);
    }
  }, [selectedItems]);

  return {
    nodeTreeRef,
    hoveredItemRef,
    focusedItemRef,
    selectedItemsRef: previousSelectedItemsRef,
  };
};
