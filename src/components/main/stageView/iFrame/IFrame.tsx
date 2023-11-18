import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import { useDispatch } from "react-redux";
import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  setIframeLoading,
  setNeedToReloadIframe,
} from "@_redux/main/stageView";

import {
  useChangeIframeTheme,
  useCmdk,
  useIframeScroll,
  useMouseEvents,
  useSideEffectHandlers,
  useTextEditing,
} from "./hooks";
import { jss } from "./js";
import { styles } from "./styles";
import { useAppState } from "@_redux/useAppState";

export const IFrame = () => {
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const dispatch = useDispatch();
  const {
    prevRenderableFileUid,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
    hoveredNodeUid,
    needToReloadIframe,
    iframeSrc,
  } = useAppState();
  const {
    setCodeViewOffsetTop,
    // toasts
    parseFileFlag,
    setParseFile,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const isEditing = useRef<boolean>(false);
  // mark hovered item
  const fnHoveredItemRef = useRef<TNodeUid>(hoveredNodeUid);
  const mostRecentSelectedNode = useRef<TNode>();

  const linkTagUid = useRef<TNodeUid>("");

  const contentEditableUidRef = useRef("");

  useEffect(() => {
    if (fnHoveredItemRef.current === hoveredNodeUid) return;

    // remove cur hovered effect
    {
      // for the elements which are created by js. (ex: Web Component)
      let curHoveredElement =
        contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${fnHoveredItemRef.current}"]`,
        );
      const isValid: null | string = curHoveredElement?.firstElementChild
        ? curHoveredElement?.firstElementChild.getAttribute(StageNodeIdAttr)
        : "";
      isValid === null
        ? (curHoveredElement = curHoveredElement?.firstElementChild)
        : null;
      curHoveredElement?.removeAttribute("rnbwdev-rnbw-element-hover");
    }

    // mark new hovered item
    {
      // for the elements which are created by js. (ex: Web Component)
      let newHoveredElement =
        contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${hoveredNodeUid}"]`,
        );
      const isValid: null | string = newHoveredElement?.firstElementChild
        ? newHoveredElement?.firstElementChild.getAttribute(StageNodeIdAttr)
        : "";
      isValid === null
        ? (newHoveredElement = newHoveredElement?.firstElementChild)
        : null;
      newHoveredElement?.setAttribute("rnbwdev-rnbw-element-hover", "");
    }

    fnHoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // iframe scroll event
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  const { onIframeScroll } = useIframeScroll({ focusedItemRef, contentRef });
  // mark&scroll to the focused item
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const newFocusedElement =
      contentRef?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${focusedItem}"]`,
      );
    const elementRect = (
      newFocusedElement as HTMLElement
    )?.getBoundingClientRect();
    setTimeout(
      () =>
        newFocusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "smooth",
        }),
      50,
    );
    if (elementRect) {
      if (elementRect.y < 0) {
        setCodeViewOffsetTop("calc(66.66vh - 12px)");
      } else {
        const innerHeight =
          contentRef?.contentWindow?.document.documentElement.clientHeight;
        const elePosition = elementRect.y + elementRect.height / 2;
        if (innerHeight) {
          if (elementRect.height < innerHeight / 2) {
            if ((elePosition / innerHeight) * 100 > 66) {
              setCodeViewOffsetTop("12px");
            }
            if ((elePosition / innerHeight) * 100 < 33) {
              setCodeViewOffsetTop("calc(66.66vh - 12px)");
            }
          }
        }
      }
    }
    focusedItemRef.current = focusedItem;
  }, [focusedItem]);
  // mark selected items
  const selectedItemsRef = useRef<TNodeUid[]>(selectedItems);

  useEffect(() => {
    if (selectedItemsRef.current.length === selectedItems.length) {
      let same = true;
      for (
        let index = 0, len = selectedItemsRef.current.length;
        index < len;
        ++index
      ) {
        if (selectedItemsRef.current[index] !== selectedItems[index])
          same = false;
        break;
      }
      if (same) return;
    }

    setTimeout(() => {
      // remove original selected effect
      selectedItemsRef.current.map((uid) => {
        // for the elements which are created by js. (ex: Web Component)
        let curselectedElement =
          contentRef?.contentWindow?.document?.querySelector(
            `[${StageNodeIdAttr}="${uid}"]`,
          );
        const isValid: null | string = curselectedElement?.firstElementChild
          ? curselectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
          : "";
        isValid === null
          ? (curselectedElement = curselectedElement?.firstElementChild)
          : null;
        curselectedElement?.removeAttribute("rnbwdev-rnbw-element-select");
      });
      // mark new selected items
      selectedItems.map((uid) => {
        // for the elements which are created by js. (ex: Web Component)
        let newSelectedElement =
          contentRef?.contentWindow?.document?.querySelector(
            `[${StageNodeIdAttr}="${uid}"]`,
          );
        const isValid: null | string = newSelectedElement?.firstElementChild
          ? newSelectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
          : "";
        isValid === null
          ? (newSelectedElement = newSelectedElement?.firstElementChild)
          : null;
        newSelectedElement?.setAttribute("rnbwdev-rnbw-element-select", "");
      });
      selectedItemsRef.current = [...selectedItems];
    }, 150);
  }, [selectedItems]);
  // -------------------------------------------------------------- side effect handlers --------------------------------------------------------------

  const {
    addElement,
    groupElement,
    removeElements,
    moveElements,
    copyElements,
    copyElementsExternal,
    duplicateElements,
  } = useSideEffectHandlers({ contentRef });

  // change iframe theme
  const { changeIframeTheme } = useChangeIframeTheme({ contentRef });
  // -------------------------------------------------------------- iframe event handlers --------------------------------------------------------------
  // mouse events

  const externalDblclick = useRef<boolean>(false);

  const dblClickTimestamp = useRef(0);

  const [isDblClick, setIsDblClick] = useState<boolean>(false);

  const { onClick, onMouseLeave, onMouseMove, onMouseEnter } = useMouseEvents({
    externalDblclick,
    linkTagUid,
    selectedItemsRef,
    mostRecentSelectedNode,
    focusedItemRef,
    contentRef,
    contentEditableUidRef,
    isEditing,
    dblClickTimestamp,
    isDblClick,
  });

  // text editing

  const { beforeTextEdit, onCmdEnter, onDblClick } = useTextEditing({
    contentEditableUidRef,
    contentRef,
    isEditing,
    mostRecentSelectedNode,
    focusedItemRef,
    dblClickTimestamp,
    externalDblclick,
  });

  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  const { onKeyDown } = useCmdk({
    contentEditableUidRef,
    mostRecentSelectedNode,
  });
  // -------------------------------------------------------------- own --------------------------------------------------------------

  // iframe skeleton
  const Skeleton = () => {
    return <div>Cool loading screen</div>;
  };

  useEffect(() => {
    changeIframeTheme();
    function handleIframeLoad() {
      console.log("Iframe loaded");
    }

    const iframe = contentRef;
    if (iframe) {
      contentRef?.contentWindow?.document?.addEventListener(
        "load",
        handleIframeLoad,
      );
    }

    return () => {
      if (iframe) {
        contentRef?.contentWindow?.document?.removeEventListener(
          "load",
          handleIframeLoad,
        );
      }
    };
  }, []);

  useEffect(() => {
    beforeTextEdit();
  }, [focusedItem]);

  useEffect(() => {
    if (contentRef) {
      dblClickTimestamp.current = 0;
      dispatch(setIframeLoading(true));
      contentRef.onload = () => {
        const _document = contentRef?.contentWindow?.document;
        const htmlNode = _document?.documentElement;
        const headNode = _document?.head;

        if (htmlNode && headNode) {
          // enable cmdk
          htmlNode.addEventListener("keydown", onKeyDown);

          // add rnbw css
          const style = _document.createElement("style");
          style.textContent = styles;
          headNode.appendChild(style);

          // add js
          const js = _document.createElement("script");
          js.setAttribute("image-validator", "true");
          js.textContent = jss;
          headNode.appendChild(js);

          // define event handlers
          htmlNode.addEventListener("mouseenter", (e: MouseEvent) => {
            onMouseEnter(e);
          });
          htmlNode.addEventListener("mousemove", (e: MouseEvent) => {
            onMouseMove(e);
          });
          htmlNode.addEventListener("mouseleave", (e: MouseEvent) => {
            onMouseLeave(e);
          });
          htmlNode.addEventListener("click", (e: MouseEvent) => {
            e.preventDefault();
            setIsDblClick(false);
            onClick(e);
          });

          let lastClickTime = 0;
          let lastClickTarget: EventTarget | null = null;
          htmlNode.addEventListener("pointerdown", (e: PointerEvent) => {
            setIsDblClick(true);
            const currentTime = e.timeStamp;
            const timeSinceLastClick = currentTime - lastClickTime;
            if (timeSinceLastClick < 500 && lastClickTarget === e.target) {
              externalDblclick.current = false;
              onDblClick(e);
            }
            lastClickTime = currentTime;
            lastClickTarget = e.target;
          });

          htmlNode.addEventListener("keydown", (e: KeyboardEvent) => {
            onCmdEnter(e);
          });
          _document.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
          });
          _document.addEventListener("scroll", (e: Event) => {
            onIframeScroll(e);
          });
        }

        dispatch(setIframeLoading(false));
      };
    }
  }, [contentRef]);

  // node actions, code change - side effect
  useEffect(() => {
    if (event) {
      //@ts-ignore //TODO: fix this
      const { type, param } = event;
      switch (type) {
        case "add-node":
          addElement(...(param as [TNodeUid, TNode, TNode | null]));
          break;
        case "remove-node":
          removeElements(...(param as [TNodeUid[], TNodeUid[], TNodeUid]));
          break;
        case "move-node":
          moveElements(...(param as [TNodeUid[], TNodeUid, boolean, number]));
          break;
        case "copy-node":
          copyElements(
            ...(param as [
              TNodeUid[],
              TNodeUid,
              boolean,
              number,
              Map<TNodeUid, TNodeUid>,
            ]),
          );
          break;
        case "copy-node-external":
          copyElementsExternal(
            ...(param as [
              TNode[],
              TNodeUid,
              boolean,
              number,
              Map<TNodeUid, TNodeUid>,
            ]),
          );
          break;
        case "duplicate-node":
          duplicateElements(
            ...(param as [TNodeUid[], Map<TNodeUid, TNodeUid>]),
          );
          break;
        case "group-node":
          groupElement(
            ...(param as [TNodeUid, TNode, TNode | null, TNodeUid[]]),
          );
          break;
        default:
          break;
      }
    }
  }, [event]);

  // reload when script changes
  useEffect(() => {
    if (needToReloadIframe) {
      contentRef?.contentWindow?.location.reload();
      dispatch(setNeedToReloadIframe(false));
      linkTagUid.current = "";
    }
  }, [needToReloadIframe, contentRef]);

  return useMemo(() => {
    const onLoad = () => {
      const iframe: any = document.getElementById("iframeId");
      const innerDoc = iframe.contentDocument
        ? iframe.contentDocument
        : iframe.contentWindow.document;
      const firstElement = innerDoc.children[0].children[1].children[0];
      firstElement.classList.add("rnbwdev-rnbw-element-select");
      firstElement.setAttribute(
        "rnbwdev-rnbw-element-select",
        "rnbwdev-rnbw-element-select",
      );
    };

    return (
      <>
        {iframeSrc && !needToReloadIframe && (
          <iframe
            ref={setContentRef}
            src={iframeSrc}
            onLoad={onLoad}
            id={"iframeId"}
            style={{
              background: "white",
              position: "absolute",
              width: "100%",
              height: "100vh",
              ...(!parseFileFlag && { overflow: "hidden" }),
            }}
          />
        )}
      </>
    );
  }, [
    iframeSrc,
    needToReloadIframe,
    parseFileFlag,
    prevRenderableFileUid,
    setParseFile,
  ]);
};
