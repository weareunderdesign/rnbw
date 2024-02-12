import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { MainContext } from "@_redux/main";
import { ResizablePanelsProps } from "./types";

const actionsPanelPx = 240;
const containerWidth = document.documentElement.clientWidth;
const actionsPanelWidth = (actionsPanelPx / containerWidth) * 100;
const codeViewWidth = 50 - actionsPanelWidth;

export default function ResizablePanels({
  actionPanel,
  stageView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView, zoomLevel } = useAppState();
  const { iframeRefRef } = useContext(MainContext);
  const [hoverSide, setHoverSide] = useState(false);

  const stageWidth = useMemo(
    () =>
      !showCodeView
        ? !showActionsPanel
          ? 50 + codeViewWidth + actionsPanelWidth
          : 50 + codeViewWidth
        : !showActionsPanel
        ? 50 + actionsPanelWidth
        : 50,
    [showActionsPanel, showCodeView],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const threshold = 100;
      if (event.clientX <= threshold) {
        setHoverSide(true);
      } else {
        if (hoverSide && event.clientX < actionsPanelPx - 1) return;
        setHoverSide(false);
      }
    },
    [hoverSide],
  );

  useEffect(() => {
    if (!showActionsPanel) {
      const iframeWindow = iframeRefRef.current?.contentWindow;
      zoomLevel === 1 &&
        iframeWindow?.addEventListener("mousemove", handleMouseMove);
      window?.addEventListener("mousemove", handleMouseMove);

      return () => {
        iframeWindow?.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [iframeRefRef.current, showActionsPanel, zoomLevel, hoverSide]);

  return (
    <>
      {!showActionsPanel && hoverSide && (
        <div
          style={{
            width: "240px",
            height: "100%",
            position: "absolute",
            zIndex: 999,
          }}
        >
          {actionPanel}
        </div>
      )}
      <PanelGroup style={{ height: "100vh" }} direction="horizontal">
        {showActionsPanel && (
          <>
            <Panel
              id="ActionsPanel"
              defaultSize={actionsPanelWidth}
              minSize={5}
              order={1}
            >
              {actionPanel}
            </Panel>
            <PanelResizeHandle className="panelResize" />
          </>
        )}

        <Panel id="StageView" defaultSize={stageWidth} minSize={10} order={2}>
          {stageView}
        </Panel>

        {showCodeView && (
          <>
            <PanelResizeHandle className="panelResize" />
            <Panel
              id="CodeView"
              defaultSize={codeViewWidth}
              minSize={5}
              order={2}
            >
              {codeView}
            </Panel>
          </>
        )}
      </PanelGroup>
    </>
  );
}
