import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { PreserveRnbwNode } from "@_node/file/handlers/constants";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  setIframeLoading,
  setNeedToReloadIframe,
} from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import { jss, styles } from "./constants";
import { markSelectedElements } from "./helpers";
import { useCmdk, useMouseEvents, useSyncNode } from "./hooks";
import { setLoadingFalse, setLoadingTrue } from "@_redux/main/processor";

type AppStateReturnType = ReturnType<typeof useAppState>;
export interface eventListenersStatesRefType extends AppStateReturnType {
  iframeRefState: HTMLIFrameElement | null;
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  hoveredItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
}

export const IFrame = () => {
  const [iframeRefState, setIframeRefState] =
    useState<HTMLIFrameElement | null>(null);
  const [document, setDocument] = useState<Document | string | undefined>("");
  const contentEditableUidRef = useRef<TNodeUid>("");
  const isEditingRef = useRef(false);
  const dispatch = useDispatch();
  const appState: AppStateReturnType = useAppState();
  const { nodeTree, project, needToReloadIframe, validNodeTree, iframeSrc } =
    appState;
  const { iframeRefRef, setIframeRefRef } = useContext(MainContext);
  // hooks
  const { nodeTreeRef, hoveredItemRef, selectedItemsRef } =
    useSyncNode(iframeRefState);

  const eventListenersStatesRef = useRef<eventListenersStatesRefType>({
    ...appState,
    iframeRefState,
    iframeRefRef,
    nodeTreeRef,
    contentEditableUidRef,
    isEditingRef,
    hoveredItemRef,
    selectedItemsRef,
  });

  const { onKeyDown, onKeyUp, handlePanelsToggle, handleZoomKeyDown } =
    useCmdk();
  const { onMouseEnter, onMouseMove, onMouseLeave, onClick, onDblClick } =
    useMouseEvents();

  const addHtmlNodeEventListeners = useCallback(
    (htmlNode: HTMLElement) => {
      //NOTE: all the values required for the event listeners are stored in the eventListenersStatesRef because the event listeners are not able to access the latest values of the variables due to the closure of the event listeners

      // enable cmdk
      htmlNode.addEventListener("keydown", (e: KeyboardEvent) => {
        //handlePanelsToggle should be called before onKeyDown as on onKeyDown the contentEditiable editing is set to false and the panels are toggled. But we don't need to toggle the panels if the user is editing the contentEditable
        handlePanelsToggle(e, eventListenersStatesRef);

        onKeyDown(e, eventListenersStatesRef);
        handleZoomKeyDown(e, eventListenersStatesRef);
      });

      htmlNode.addEventListener("mouseenter", () => {
        onMouseEnter();
      });
      htmlNode.addEventListener("mousemove", (e: MouseEvent) => {
        onMouseMove(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("mouseleave", () => {
        onMouseLeave();
      });

      htmlNode.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        onClick(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("dblclick", (e: MouseEvent) => {
        e.preventDefault();
        onDblClick(e, eventListenersStatesRef);
      });
      htmlNode.addEventListener("keyup", (e: KeyboardEvent) => {
        e.preventDefault();
        onKeyUp(e, eventListenersStatesRef);
      });
    },
    [
      onKeyDown,
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onClick,
      onDblClick,
      onKeyUp,
    ],
  );

  const iframeOnload = useCallback(() => {
    LogAllow && console.log("iframe loaded");

    const _document = iframeRefState?.contentWindow?.document;
    const htmlNode = _document?.documentElement;
    const headNode = _document?.head;
    setDocument(_document);
    if (htmlNode && headNode) {
      // add rnbw css
      const style = _document.createElement("style");
      style.textContent = styles;
      style.setAttribute(PreserveRnbwNode, "true");
      headNode.appendChild(style);

      // add image-validator js
      const js = _document.createElement("script");
      js.setAttribute("image-validator", "true");
      js.setAttribute(PreserveRnbwNode, "true");
      js.textContent = jss;
      headNode.appendChild(js);

      // define event handlers
      addHtmlNodeEventListeners(htmlNode);

      // disable contextmenu
      _document.addEventListener("contextmenu", (e: MouseEvent) => {
        e.preventDefault();
      });
    }

    // mark selected elements on load
    markSelectedElements(iframeRefState, selectedItemsRef.current, nodeTree);

    dispatch(setIframeLoading(false));
    project.context === "local" && dispatch(setLoadingFalse());
  }, [
    iframeRefState,
    addHtmlNodeEventListeners,
    selectedItemsRef,
    nodeTree,
    dispatch,
    project,
  ]);

  // init iframe
  useEffect(() => {
    setIframeRefRef(iframeRefState);
    if (iframeRefState) {
      project.context === "local" && dispatch(setLoadingTrue());
      dispatch(setIframeLoading(true));

      iframeRefState.onload = iframeOnload;
    }
    return () => {
      // Cleanup function to remove event listener
      if (iframeRefState) {
        iframeRefState.onload = null;
      }
    };
  }, [iframeRefState]);

  // reload iframe
  useEffect(() => {
    needToReloadIframe && dispatch(setNeedToReloadIframe(false));
  }, [needToReloadIframe]);

  useEffect(() => {
    if (iframeRefState && document) {
      const iframeDocument = document as Document;
      if (!iframeDocument) return;

      const wrapTextNodes = (element: HTMLElement) => {
        const childNodes = element.childNodes;

        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];
          if (!node) continue;

          if (node.nodeType === Node.TEXT_NODE) {
            const nodeValue = node.nodeValue?.replace(/[\n\s]/g, "");

            if (!nodeValue) continue;

            const span = iframeDocument.createElement("span");
            const text = iframeDocument.createTextNode(node.nodeValue || "");
            const uid = element.getAttribute("data-rnbw-stage-node-id");

            if (!uid) continue;

            const nodeChildren = validNodeTree[uid]?.children;
            const filterArr = nodeChildren?.filter(
              (uid) => validNodeTree[uid]?.data?.textContent == node.nodeValue,
            );

            if (!filterArr || !filterArr.length) {
              element.setAttribute("rnbw-text-element", "true");
              continue;
            }

            span.appendChild(text);
            span.setAttribute("rnbw-text-element", "true");
            span.setAttribute(
              "data-rnbw-stage-node-id",
              `${filterArr?.length ? filterArr[0] : i}`,
            );

            node.parentNode?.replaceChild(span, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextNodes(node as HTMLElement);
          }
        }
      };

      wrapTextNodes(iframeDocument.body);
    }
  }, [iframeRefState, document, needToReloadIframe, validNodeTree]);

  useEffect(() => {
    eventListenersStatesRef.current = {
      ...appState,
      iframeRefState,
      iframeRefRef,
      nodeTreeRef,
      contentEditableUidRef,
      isEditingRef,
      hoveredItemRef,
      selectedItemsRef,
    };
  }, [
    needToReloadIframe,

    iframeRefState,
    iframeRefRef.current,
    nodeTreeRef.current,
    contentEditableUidRef.current,
    isEditingRef.current,
    hoveredItemRef.current,
    selectedItemsRef.current,
    appState,
  ]);

  return useMemo(() => {
    return (
      <>
        {iframeSrc && !needToReloadIframe && (
          <iframe
            ref={setIframeRefState}
            id={"iframeId"}
            src={iframeSrc}
            style={{
              background: "white",
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </>
    );
  }, [iframeSrc, needToReloadIframe]);
};
