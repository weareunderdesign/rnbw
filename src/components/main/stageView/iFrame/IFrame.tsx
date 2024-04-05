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
import { TCmdkReferenceData } from "@_redux/main/cmdk";
import { TOsType } from "@_redux/global";

export interface eventListenersStatesRefType {
  showCodeView: boolean;
  showActionsPanel: boolean;
  needToReloadIframe: boolean;
  iframeSrc: string | null;
  iframeRefState: HTMLIFrameElement | null;
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  hoveredItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  activePanel: string;
  osType: TOsType;
  cmdkReferenceData: TCmdkReferenceData;
  isCodeTyping: boolean;
  formatCode: boolean;
}
export const IFrame = () => {
  const [iframeRefState, setIframeRefState] =
    useState<HTMLIFrameElement | null>(null);
  const [document, setDocument] = useState<Document | string | undefined>("");
  const contentEditableUidRef = useRef<TNodeUid>("");
  const isEditingRef = useRef(false);
  const dispatch = useDispatch();
  const {
    needToReloadIframe,
    iframeSrc,
    project,
    showActionsPanel,
    showCodeView,
    nodeTree,
    validNodeTree,
    activePanel,
    osType,
    cmdkReferenceData,
    isCodeTyping,
    formatCode,
  } = useAppState();
  const { iframeRefRef, setIframeRefRef } = useContext(MainContext);
  const allPanelsClosedRef = useRef(!showActionsPanel && !showCodeView);
  // hooks
  const { nodeTreeRef, hoveredItemRef, selectedItemsRef } =
    useSyncNode(iframeRefState);

  const eventListenersStatesRef = useRef<eventListenersStatesRefType>({
    showCodeView,
    showActionsPanel,
    needToReloadIframe,
    iframeSrc,
    iframeRefState,
    iframeRefRef,
    nodeTreeRef,
    contentEditableUidRef,
    isEditingRef,
    hoveredItemRef,
    selectedItemsRef,
    activePanel,
    osType,
    cmdkReferenceData,
    isCodeTyping,
    formatCode,
  });

  const { onKeyDown, onKeyUp, handlePanelsToggle, handleZoomKeyDown } =
    useCmdk();
  const { onMouseEnter, onMouseMove, onMouseLeave, onClick, onDblClick } =
    useMouseEvents(eventListenersStatesRef);

  useEffect(() => {
    allPanelsClosedRef.current = !showActionsPanel && !showCodeView;
  }, [showActionsPanel, showCodeView]);

  const addHtmlNodeEventListeners = useCallback(
    (htmlNode: HTMLElement) => {
      // define event handlers

      // enable cmdk
      htmlNode.addEventListener("keydown", (e: KeyboardEvent) => {
        onKeyDown(e, eventListenersStatesRef);
        handleZoomKeyDown(e, eventListenersStatesRef);
        handlePanelsToggle(e, eventListenersStatesRef);
      });

      htmlNode.addEventListener("mouseenter", () => {
        onMouseEnter();
      });
      htmlNode.addEventListener("mousemove", (e: MouseEvent) => {
        onMouseMove(e);
      });
      htmlNode.addEventListener("mouseleave", () => {
        onMouseLeave();
      });

      htmlNode.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        onClick(e);
      });
      htmlNode.addEventListener("dblclick", (e: MouseEvent) => {
        e.preventDefault();
        onDblClick(e);
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

      if (iframeDocument) {
        const wrapTextNodes = (element: HTMLElement) => {
          const childNodes = element.childNodes;

          for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];

            if (node && node.nodeType === Node.TEXT_NODE) {
              if (!node?.nodeValue?.replace(/[\n\s]/g, "").length) continue;
              const span = iframeDocument.createElement("span");
              const text = iframeDocument.createTextNode(node.nodeValue || "");
              const uid = element.getAttribute("data-rnbw-stage-node-id");

              if (!uid) continue;
              const nodeChildren = validNodeTree[uid]?.children;

              const filterArr = nodeChildren?.filter(
                (uid) =>
                  validNodeTree[uid]?.data?.textContent == node.nodeValue,
              );

              span.appendChild(text);
              span.setAttribute("rnbw-text-element", "true");
              span.setAttribute(
                "data-rnbw-stage-node-id",
                `${filterArr?.length ? filterArr[0] : i}`,
              );

              node.parentNode && node.parentNode.replaceChild(span, node);
            } else if (node && node.nodeType === Node.ELEMENT_NODE) {
              wrapTextNodes(node as HTMLElement);
            }
          }
        };

        wrapTextNodes(iframeDocument.body);
      }
    }
  }, [iframeRefState, document, needToReloadIframe, validNodeTree]);

  useEffect(() => {
    eventListenersStatesRef.current = {
      showCodeView,
      showActionsPanel,
      needToReloadIframe,
      iframeSrc,
      iframeRefState,
      iframeRefRef,
      nodeTreeRef,
      contentEditableUidRef,
      isEditingRef,
      hoveredItemRef,
      selectedItemsRef,
      activePanel,
      osType,
      cmdkReferenceData,
      isCodeTyping,
      formatCode,
    };
  }, [
    showActionsPanel,
    showCodeView,
    needToReloadIframe,
    iframeSrc,
    iframeRefState,
    iframeRefRef,
    nodeTreeRef,
    contentEditableUidRef,
    isEditingRef,
    hoveredItemRef,
    selectedItemsRef,
    activePanel,
    osType,
    cmdkReferenceData,
    isCodeTyping,
    formatCode,
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
