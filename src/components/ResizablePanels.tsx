import React, { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { ResizablePanelsProps } from "../rnbw";

const ACTIONPANELWIDTH = 10;
const CODEVIEWWIDTH = 30;

export default function ResizablePanels({
  sidebarView,
  designView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();

  const [isActionPanelHovered, setIsActionPanelHovered] = useState(false);
  const [isCodeViewHovered, setIsCodeViewHovered] = useState(false);

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
              id="rnbw-actions-panel"
              defaultSize={ACTIONPANELWIDTH}
              minSize={showActionsPanel ? 10 : 0}
              order={1}
              style={{
                minWidth: showActionsPanel ? "330px" : 0,
              }}
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
