import React, { useState } from "react";

import { useAppState } from "@_redux/useAppState";
import { ResizablePanelsProps } from "../rnbw";

const CODE_VIEW_WIDTH = "320px";
const ACTIONS_PANEL_WIDTH = "240px";

export default function ResizablePanels({
  sidebarView,
  designView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();

  const [isActionPanelHovered, setIsActionPanelHovered] = useState(false);
  const [isCodeViewHovered, setIsCodeViewHovered] = useState(false);

  const wrapperStyle: React.CSSProperties = {
    width:
      showActionsPanel || isActionPanelHovered ? ACTIONS_PANEL_WIDTH : "2px",
    height: "100%",
    position: showActionsPanel ? "relative" : "absolute",
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width:
      showActionsPanel || isActionPanelHovered ? ACTIONS_PANEL_WIDTH : "0px",
    height: "100vh",
    transform:
      showActionsPanel || isActionPanelHovered
        ? "translateX(0px)"
        : "translateX(-300px)",
  };

  const codeViewWrapperStyle: React.CSSProperties = {
    width: showCodeView || isCodeViewHovered ? CODE_VIEW_WIDTH : "32px",
    height: "100vh",
    position: showCodeView ? "relative" : "absolute",
    zIndex: 10,
    right: "0px",
  };

  const codeViewStyle: React.CSSProperties = {
    width: showCodeView || isCodeViewHovered ? CODE_VIEW_WIDTH : "0px",
    height: "100%",
    right: "0px",
    zIndex: 10,
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%" }}>
      <div
        style={wrapperStyle}
        onMouseEnter={() => setIsActionPanelHovered(true)}
        onMouseLeave={() => setIsActionPanelHovered(false)}
      >
        <div style={actionsPanelStyle}>{sidebarView}</div>
      </div>

      {designView}
      <div
        style={codeViewWrapperStyle}
        onMouseEnter={() => setIsCodeViewHovered(true)}
        onMouseLeave={() => setIsCodeViewHovered(false)}
      >
        <div style={codeViewStyle}>{codeView}</div>
      </div>
    </div>
  );
}
