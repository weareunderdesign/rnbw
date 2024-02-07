import React, { ReactNode, useState, useEffect, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { MainContext } from "@_redux/main";

const actionsPanelPx = 240;
const containerWidth = document.documentElement.clientWidth;
const actionsPanelWidth = (actionsPanelPx / containerWidth) * 100;

export default function ResizablePanels({
  actionPanel,
  stageView,
  codeView,
}: {
  actionPanel: ReactNode;
  stageView: ReactNode;
  codeView: ReactNode;
}) {
  const { showActionsPanel, showCodeView, zoomLevel } = useAppState();
  const { iframeRefRef } = useContext(MainContext);
  const [hoverSide, setHoverSide] = useState(false);

  const handleMouseMove = (event: MouseEvent) => {
    const threshold = 100;
    if (event.clientX <= threshold) {
      setHoverSide(true);
    } else {
      if (hoverSide && event.clientX < actionsPanelPx - 1) return;
      setHoverSide(false);
    }
  };

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
              minSize={10}
              order={1}
              style={{ padding: "12px 0px 12px 12px" }}
            >
              {actionPanel}
            </Panel>
            <PanelResizeHandle
              className="panelResize-horizontal"
              style={{
                width: "3px",
              }}
            />
          </>
        )}

        <Panel
          defaultSize={showActionsPanel ? 100 - actionsPanelWidth : 100}
          minSize={10}
          order={3}
          id="VerticalContainer"
        >
          <PanelGroup direction="vertical">
            <Panel
              id="StageView"
              defaultSize={showCodeView ? 60 : 100}
              minSize={10}
              order={2}
            >
              {stageView}
            </Panel>

            {showCodeView && (
              <>
                <PanelResizeHandle
                  className="panelResize-vertical"
                  style={{
                    height: "3px",
                  }}
                />
                <Panel
                  id="CodeView"
                  defaultSize={40}
                  minSize={10}
                  order={2}
                  style={{
                    padding: `0px 12px 12px ${
                      showActionsPanel ? "0px" : "12px"
                    }`,
                    width: hoverSide
                      ? `calc(100% - ${actionsPanelPx}px)`
                      : "100%",
                    alignSelf: "end",
                  }}
                >
                  {codeView}
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </>
  );
}
