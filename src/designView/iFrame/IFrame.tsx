import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setReloadIframe } from '@_redux/main/designView';

import { useDispatch, useSelector } from "react-redux";

import { LogAllow } from "@src/rnbwTSX";
import { PreserveRnbwNode } from "@_api/file/handlers";
import { TNodeTreeData, TNodeUid } from "@_api/types";
import { MainContext } from "@_redux/main";
import { setIframeLoading } from "@_redux/main/designView";
import { useAppState } from "@_redux/useAppState";

import { jss, styles } from "./constants";
import { markSelectedElements } from "./helpers";
import { useCmdk, useMouseEvents, useSyncNode } from "./hooks";
import { AppState } from "@src/_redux/_root";
import { debounce } from "lodash";

type AppStateReturnType = ReturnType<typeof useAppState>;
export interface eventListenersStatesRefType extends AppStateReturnType {
  iframeRefState: HTMLIFrameElement | null;
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  hoveredItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  hoveredTargetRef: React.MutableRefObject<EventTarget | null>;
}

export const IFrame = () => {
  const [iframeRefState, setIframeRefState] =
    useState<HTMLIFrameElement | null>(null);
  const [document, setDocument] = useState<Document | string | undefined>("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomVelocity, setZoomVelocity] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const zoomBreakpoints = [0.5, 1, 1.5, 2, 3];
  const containerRef = useRef<HTMLDivElement>(null);

  const isEditingRef = useRef(false);
  const dispatch = useDispatch();
  const appState: AppStateReturnType = useAppState();
  const { nodeTree, project, validNodeTree, iframeSrc, renderableFileUid } =
    appState;
  const { iframeRefRef, setIframeRefRef, contentEditableUidRef } =
    useContext(MainContext);
  // hooks
  const { nodeTreeRef, hoveredItemRef, selectedItemsRef } =
    useSyncNode(iframeRefState);
  const hoveredTargetRef = useRef(null);
  const eventListenersStatesRef = useRef<eventListenersStatesRefType>({
    ...appState,
    iframeRefState,
    iframeRefRef,
    nodeTreeRef,
    contentEditableUidRef,
    isEditingRef,
    hoveredItemRef,
    selectedItemsRef,
    hoveredTargetRef,
  });

  const { onKeyDown, onKeyUp, handlePanelsToggle } = useCmdk();
  const {
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onClick,
    onDblClick,
    onMouseOver,
  } = useMouseEvents();

  const smoothZooming = useCallback(() => {
    let animationFrame: number;
    const smoothZoom = () => {
      setZoomLevel((prevZoom) => {
        const nextZoom = prevZoom + zoomVelocity;
        const closestBreakpoint = zoomBreakpoints.reduce((prev, curr) => {
          return Math.abs(curr - nextZoom) < Math.abs(prev - nextZoom) ? curr : prev;
        }, prevZoom);
        
        return Math.min(Math.max(closestBreakpoint, 0.5), 3);
      });

      setZoomVelocity((prevVelocity) => {
        const newVelocity = prevVelocity * 0.9;
        return Math.abs(newVelocity) < 0.001 ? 0 : newVelocity;
      });

      animationFrame = requestAnimationFrame(smoothZoom);
    };

    animationFrame = requestAnimationFrame(smoothZoom);
    return animationFrame;
  }, [zoomVelocity, zoomBreakpoints]);

  useEffect(() => {
    if (zoomVelocity !== 0) {
      const animationFrame = smoothZooming();
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [zoomVelocity, smoothZooming])

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.02 : -0.02;
        setZoomVelocity((prevVelocity) => prevVelocity + delta);
      } else {
        const { x, y } = panOffset;
        const newPanOffset = {
          x: x - event.deltaX * 0.3,
          y: y - event.deltaY * 0.3,
        };
        setPanOffset(newPanOffset);
      }
    },
    [panOffset]
  );

  useEffect(() => {
    if (iframeRefState) {
      const iframeDocument = iframeRefState.contentWindow?.document;
      iframeDocument?.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        iframeDocument?.removeEventListener("wheel", handleWheel);
      };
    }
  }, [iframeRefState, handleWheel])

  const reloadIframe = useSelector((state: AppState) => state.main.designView.reloadIframe);

  useEffect(() => { // Debounce (150ms) prevents rapid reloads when the "R" key is pressed repeatedly.
    const safeReloadIframe = debounce(() => {
      if (reloadIframe && iframeRefState?.contentWindow) {
        try {
          const currentSrc = iframeRefState.src;
  
          if (iframeSrc && currentSrc !== iframeSrc) {
            iframeRefState.src = iframeSrc;
          } else {
            // Force reload by resetting the same src
            iframeRefState.src = currentSrc;
          }
  
          dispatch(setReloadIframe(false));
          console.log("Iframe reload success!");

        } catch (error) {
          console.error("Iframe reload failed:", error);
          dispatch(setReloadIframe(false));
        }
      }
    }, 150); // 150ms debounce delay
    safeReloadIframe();

  return () => {
    safeReloadIframe.cancel();
  };
}, [reloadIframe, iframeRefState, iframeSrc, dispatch]);

  useEffect(() => {
    iframeOnload();
  }, [zoomLevel]);

  useEffect(() => {
    if (zoomVelocity !== 0) {
      let animationFrame: number;
  
      const smoothZoom = () => {
        setZoomLevel((prevZoom) => {
          const newZoom = prevZoom + zoomVelocity;
          return Math.min(Math.max(newZoom, 0.5), 3);
        });
  
        setZoomVelocity((prevVelocity) => {
          const newVelocity = prevVelocity * 0.9;
          return Math.abs(newVelocity) < 0.001 ? 0 : newVelocity;
        });
  
        animationFrame = requestAnimationFrame(smoothZoom);
      };
  
      animationFrame = requestAnimationFrame(smoothZoom);
  
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [zoomVelocity]);

  const addHtmlNodeEventListeners = useCallback(
    (htmlNode: HTMLElement) => {

      htmlNode.addEventListener("keydown", (e: KeyboardEvent) => {
        handlePanelsToggle(e, eventListenersStatesRef);
        onKeyDown(e, eventListenersStatesRef);
        window.parent.postMessage(
          { type: "keydown", key: e.key, code: e.code },
          "*"
        );

        if (e.ctrlKey || e.metaKey) {
          if (e.key === "=" || e.key === "+") {
            e.preventDefault();
            setZoomVelocity((prevVelocity) => prevVelocity + 0.02);
             // Smooth zoom in
          } else if (e.key === "-") {
            e.preventDefault();
            setZoomVelocity((prevVelocity) => prevVelocity - 0.02); // Smooth zoom out
          } else if (e.key === "0") {
            e.preventDefault();
            setZoomVelocity(1);
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 })
          }
        }
      });

      htmlNode.addEventListener("mouseenter", () => {
        onMouseEnter();
      });
      htmlNode.addEventListener("mousemove", (e: MouseEvent) => {
        onMouseMove(e, eventListenersStatesRef);
        window.parent.postMessage(
          { type: "mousemove", movementX: e.movementX, movementY: e.movementY },
          "*",
        );
      });
      htmlNode.addEventListener("mouseleave", () => {
        onMouseLeave();
      });

      htmlNode.addEventListener("mouseover", (e: MouseEvent) => {
        onMouseOver(e, eventListenersStatesRef);
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
      htmlNode.addEventListener(
        "wheel",
        (event: WheelEvent) => {
          if (event.ctrlKey) {
            event.preventDefault();
            setZoomVelocity((prevVelocity) => {
              const delta = event.deltaY < 0 ? 0.02 : -0.02;
              return prevVelocity + delta;
            });
          }
          
        },
        { passive: true }
      );
      htmlNode.addEventListener("mousedown", (event) => {
        window.parent.postMessage(
          { type: "mousedown", which: event.which },
          "*",
        );
      });
      htmlNode.addEventListener("mouseup", (event) => {
        window.parent.postMessage({ type: "mouseup", which: event.which }, "*");
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
      handlePanelsToggle
    ],
  );

  const isIframeLoaded = useCallback(() => {
    if (!iframeRefState) return;
    const _document = iframeRefState.contentWindow?.document;
    if (_document?.readyState === "complete") {
      return true;
    } else {
      isIframeLoaded();
    }
  }, [iframeRefState]);
  const iframeOnload = useCallback(() => {
    LogAllow && console.log("iframe loaded");
  
    const _document = iframeRefState?.contentWindow?.document;
    const body = _document?.body;
    if (body) {
      body.style.transformOrigin = "top left";
      body.style.transition = "transform 0.2s ease-out";
      const adjustedZoom = Math.max(zoomLevel, 0.5);
      body.style.transform = `scale(${adjustedZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`;
      body.style.width = `${100 / adjustedZoom}%`;
      body.style.height = `${100 / adjustedZoom}%`;
    }
  
    const htmlNode = _document?.documentElement;
    const headNode = _document?.head;
    setDocument(_document);
    if (htmlNode && headNode) {
      setIframeLoading(true);
      const style = _document.createElement("style");
      style.textContent = styles;
      style.setAttribute(PreserveRnbwNode, "true");
      headNode.appendChild(style);
  
      const js = _document.createElement("script");
      js.setAttribute("image-validator", "true");
      js.setAttribute(PreserveRnbwNode, "true");
      js.textContent = jss;
      headNode.appendChild(js);
  
      addHtmlNodeEventListeners(htmlNode);
  
      _document.addEventListener("contextmenu", (e: MouseEvent) => {
        e.preventDefault();
      });
      if (isIframeLoaded()) {
        dispatch(setIframeLoading(false));
      }
    }
  
    markSelectedElements(iframeRefState, selectedItemsRef.current, nodeTree);
    iframeRefState?.focus();
    dispatch(setIframeLoading(false));
  }, [
    iframeRefState, selectedItemsRef, nodeTree, dispatch, project, zoomLevel, panOffset]);

  // init iframe
  useEffect(() => {
    setIframeRefRef(iframeRefState);
    if (iframeRefState) {
      iframeRefState.onload = iframeOnload;
    }
    return () => {
      // Cleanup function to remove event listener
      if (iframeRefState) {
        iframeRefState.onload = null;
      }
    };
  }, [iframeRefState]);

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
            const stageUid = filterArr?.length ? filterArr[0] : i;

            span.setAttribute("data-rnbw-stage-node-id", `${stageUid}`);
            if (selectedItemsRef.current.includes(`${stageUid}`)) {
              span.setAttribute("rnbwdev-rnbw-element-select", "true");
            }
            node.parentNode?.replaceChild(span, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextNodes(node as HTMLElement);
          }
        }
      };

      wrapTextNodes(iframeDocument.body);
    }
  }, [iframeRefState, document, validNodeTree, selectedItemsRef.current]);

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
      hoveredTargetRef,
    };
  }, [
    iframeRefState,
    iframeRefRef.current,
    nodeTreeRef.current,
    contentEditableUidRef.current,
    isEditingRef.current,
    hoveredItemRef.current,
    selectedItemsRef.current,
    appState,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);
  useEffect(() => {
    const body = iframeRefState?.contentWindow?.document.body;
    if (body) {
      const adjustedZoom = Math.max(zoomLevel, 0.5);
      body.style.transform = `scale(${adjustedZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`;
    }
  }, [zoomLevel, panOffset]);

  return useMemo(() => {
    return (
      <div 
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {iframeSrc && (
          <iframe
            key={renderableFileUid}
            ref={setIframeRefState}
            id={"iframeId"}
            src={iframeSrc}
            style={{
              background: "white",
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: "auto"
            }}
          />
        )}
      </div>
    );
  }, [iframeSrc]);
};


// export const IFrame = () => {
//   const [iframeRefState, setIframeRefState] = useState<HTMLIFrameElement | null>(null);
//   const [document, setDocument] = useState<Document | string | undefined>("");
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [zoomVelocity, setZoomVelocity] = useState(0);
//   const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
//   const [isDragging, setIsDragging] = useState(false);
//   const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
//   const zoomBreakpoints = [0.5, 1, 1.5, 2, 3];
//   const appState: AppStateReturnType = useAppState();
//   const { nodeTree, project, validNodeTree, iframeSrc, renderableFileUid } =
//   appState;
//   const containerRef = useRef<HTMLDivElement>(null);

//   // ... (keep other existing state and refs)

//   // Add message handler for iframe communication
//   useEffect(() => {
//     const handleMessage = (event: MessageEvent) => {
//       if (!iframeRefState?.contentWindow) return;
      
//       if (event.source === iframeRefState.contentWindow) {
//         const { type, data } = event.data;
        
//         switch (type) {
//           case 'wheel':
//             handleWheel(data);
//             break;
//           case 'mousedown':
//             handleMouseDown(data);
//             break;
//           case 'mouseup':
//             handleMouseUp();
//             break;
//           case 'mousemove':
//             handleMouseMove(data);
//             break;
//         }
//       }
//     };

//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, [iframeRefState]);

//   const handleWheel = useCallback((event: WheelEvent) => {
//     if (event.ctrlKey || event.metaKey) {
//       event.preventDefault();
//       const delta = event.deltaY < 0 ? 0.02 : -0.02;
//       setZoomVelocity(prev => prev + delta);
//     } else {
//       setPanOffset(prev => ({
//         x: prev.x - event.deltaX * 0.5,
//         y: prev.y - event.deltaY * 0.5
//       }));
//     }
//   }, []);

//   const handleMouseDown = useCallback((event: MouseEvent) => {
//     if (event.button === 0) { // Left mouse button
//       setIsDragging(true);
//       setLastMousePosition({
//         x: event.clientX,
//         y: event.clientY
//       });
//     }
//   }, []);

//   const handleMouseUp = useCallback(() => {
//     setIsDragging(false);
//   }, []);

//   const handleMouseMove = useCallback((event: MouseEvent) => {
//     if (!isDragging) return;
    
//     const deltaX = event.clientX - lastMousePosition.x;
//     const deltaY = event.clientY - lastMousePosition.y;
    
//     setPanOffset(prev => ({
//       x: prev.x + deltaX,
//       y: prev.y + deltaY
//     }));
    
//     setLastMousePosition({
//       x: event.clientX,
//       y: event.clientY
//     });
//   }, [isDragging, lastMousePosition]);

//   // Add script to iframe on load to relay events
//   const addIframeEventRelay = useCallback((iframeDocument: Document) => {
//     const script = iframeDocument.createElement('script');
//     script.textContent = `
//       document.addEventListener('wheel', (e) => {
//         window.parent.postMessage({ type: 'wheel', data: {
//           deltaX: e.deltaX,
//           deltaY: e.deltaY,
//           ctrlKey: e.ctrlKey,
//           metaKey: e.metaKey
//         }}, '*');
//         if (e.ctrlKey || e.metaKey) e.preventDefault();
//       }, { passive: false });

//       document.addEventListener('mousedown', (e) => {
//         window.parent.postMessage({ type: 'mousedown', data: {
//           button: e.button,
//           clientX: e.clientX,
//           clientY: e.clientY
//         }}, '*');
//       });

//       document.addEventListener('mouseup', (e) => {
//         window.parent.postMessage({ type: 'mouseup' }, '*');
//       });

//       document.addEventListener('mousemove', (e) => {
//         window.parent.postMessage({ type: 'mousemove', data: {
//           clientX: e.clientX,
//           clientY: e.clientY
//         }}, '*');
//       });
//     `;
//     iframeDocument.head.appendChild(script);
//   }, []);

//   // Modified iframeOnload to include event relay setup
//   const iframeOnload = useCallback(() => {
//     LogAllow && console.log("iframe loaded");
  
//     const _document = iframeRefState?.contentWindow?.document;
//     if (!_document) return;

//     const body = _document.body;
//     if (body) {
//       body.style.transformOrigin = "top left";
//       body.style.transition = "transform 0.1s ease-out";
//       const adjustedZoom = Math.max(zoomLevel, 0.5);
//       body.style.transform = `scale(${adjustedZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`;
//       body.style.width = `${100 / adjustedZoom}%`;
//       body.style.height = `${100 / adjustedZoom}%`;
//     }

//     // Add event relay script
//     addIframeEventRelay(_document);

//     // ... (rest of your existing iframeOnload logic)
//   }, [iframeRefState, addIframeEventRelay, zoomLevel, panOffset]);

//   // Update transform when zoom or pan changes
//   useEffect(() => {
//     const body = iframeRefState?.contentWindow?.document.body;
//     if (body) {
//       const adjustedZoom = Math.max(zoomLevel, 0.5);
//       body.style.transform = `scale(${adjustedZoom}) translate(${panOffset.x}px, ${panOffset.y}px)`;
//       body.style.width = `${100 / adjustedZoom}%`;
//       body.style.height = `${100 / adjustedZoom}%`;
//     }
//   }, [zoomLevel, panOffset, iframeRefState]);

//   // ... (keep other existing effects)

//   return useMemo(() => {
//     return (
//       <div 
//         ref={containerRef}
//         style={{
//           width: "100%",
//           height: "100%",
//           overflow: "hidden",
//           position: "relative"
//         }}
//       >
//         {iframeSrc && (
//           <iframe
//             key={renderableFileUid}
//             ref={setIframeRefState}
//             id={"iframeId"}
//             src={iframeSrc}
//             style={{
//               background: "white",
//               width: "100%",
//               height: "100%",
//               border: "none",
//               pointerEvents: "auto"
//             }}
//           />
//         )}
//       </div>
//     );
//   }, [iframeSrc]);
// };