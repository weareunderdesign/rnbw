import {
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { useDispatch } from "react-redux";
import { setZoomLevel } from "@_redux/main/stageView";

export const useZoom = (
  iframeRefState: HTMLIFrameElement | null,
  isEditingRef: MutableRefObject<boolean>,
) => {
  const { isCodeTyping } = useContext(MainContext);
  const { activePanel, zoomLevel } = useAppState();
  const dispatch = useDispatch();

  const activePanelRef = useRef(activePanel);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  const setZoom = useCallback(
    (level: number) => {
      dispatch(setZoomLevel(level));
      if (!iframeRefState) return;
      iframeRefState.style.transform = `scale(${level})`;
      iframeRefState.style.transformOrigin = `top ${
        level > 1 ? "left" : "center"
      }`;
    },
    [iframeRefState],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        activePanelRef.current === "code" ||
        isCodeTyping.current ||
        isEditingRef.current
      )
        return;

      const key = event.key;

      switch (key) {
        case "0":
        case "Escape":
          setZoom(1);
          break;
        case "+":
          setZoom(zoomLevel + 0.25);
          break;
        case "-":
          setZoom(zoomLevel <= 0.25 ? zoomLevel : zoomLevel - 0.25);
          break;
        default:
          if (key >= "1" && key <= "9") {
            setZoom(Number(`0.${key}`));
          }
          break;
      }
    },
    [setZoom, zoomLevel, activePanelRef.current, isCodeTyping.current],
  );

  useEffect(() => {
    const _document = iframeRefState?.contentWindow?.document;
    const htmlNode = _document?.documentElement;

    htmlNode?.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      htmlNode?.removeEventListener("keydown", handleKeyDown);
    };
  }, [iframeRefState, activePanel, zoomLevel]);
};
