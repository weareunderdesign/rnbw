import React, { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { ResizablePanelsProps } from "../rnbw";

const CODEVIEWWIDTH = 25;

export default function ResizablePanels({
  sidebarView,
  designView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();
  const actionsPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);

  const [isActionPanelHovered, setIsActionPanelHovered] = useState(false);
  const [isCodeViewHovered, setIsCodeViewHovered] = useState(false);
  const defaultActionsPanelWidthRef = useRef(0);

  const wrapperStyle: React.CSSProperties = {
    width: "2px",
    height: "100%",
    position: "absolute",
    zIndex: 10,
  };

  const codeViewWrapperStyle: React.CSSProperties = {
    width: showCodeView ? 0 : "32px",
    overflow: showCodeView ? "hidden" : "visible",
    height: "100%",
    position: "absolute",
    right: "0px",
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: "240px",
    height: "100%",
    transform: isActionPanelHovered ? "translateX(0px)" : "translateX(-300px)",
  };

  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth;
      const targetWidthInPixels = 240;
      const calculatedWidth = (targetWidthInPixels / availableWidth) * 100;

      if (showActionsPanel && actionsPanelRef.current) {
        actionsPanelRef.current.resize(calculatedWidth);
        if (defaultActionsPanelWidthRef.current === 0) {
          defaultActionsPanelWidthRef.current = calculatedWidth;
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial calculation
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [showActionsPanel]);

  return (
    <>
      {!showActionsPanel && (
        <div
          style={wrapperStyle}
          onMouseEnter={() => setIsActionPanelHovered(true)}
          onMouseLeave={() => setIsActionPanelHovered(false)}
        >
          <div style={actionsPanelStyle}>{sidebarView}</div>
        </div>
      )}

      <div
        style={codeViewWrapperStyle}
        onMouseEnter={() => setIsCodeViewHovered(true)}
        onMouseLeave={() => setIsCodeViewHovered(false)}
      />

      <PanelGroup
        autoSaveId="rnbw-panel-group"
        style={{ height: "100vh" }}
        direction="horizontal"
      >
        {showActionsPanel && (
          <>
            <Panel
              ref={actionsPanelRef}
              id="rnbw-actions-panel"
              defaultSize={defaultActionsPanelWidthRef.current}
              minSize={
                showActionsPanel ? defaultActionsPanelWidthRef.current : 0
              }
              order={1}
            >
              {sidebarView}
            </Panel>
            <PanelResizeHandle style={{ width: 0 }} />
          </>
        )}

        <Panel order={2} id="rnbw-design-view" minSize={10}>
          {designView}
        </Panel>

        <PanelResizeHandle style={{ width: 3 }} />
        <Panel
          ref={codeViewRef}
          id="rnbw-code-view"
          defaultSize={showCodeView ? CODEVIEWWIDTH : 0}
          minSize={showCodeView || isCodeViewHovered ? CODEVIEWWIDTH : 0}
          order={3}
          style={{
            maxWidth: showCodeView || isCodeViewHovered ? "unset" : 0,
          }}
          onMouseEnter={() => setIsCodeViewHovered(true)}
          onMouseLeave={() => setIsCodeViewHovered(false)}
        >
          {codeView}
        </Panel>
      </PanelGroup>
    </>
  );
}
