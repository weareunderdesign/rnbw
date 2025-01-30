/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-comment-textnodes */
import React, { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { ResizablePanelsProps } from "../rnbw";
import { useLayoutMode } from "./context/LayoutModeContext";
import SVGIcon from "./SvgIcon";

const actionsPanelWidth = 10;

export default function ResizablePanels({
  sidebarView,
  designView,
}: ResizablePanelsProps) {
  const { showActionsPanel } = useAppState();
  const { layoutMode } = useLayoutMode();
  const [sizes, setSizes] = useState([actionsPanelWidth, 90]); // Adjusted to ensure total is 100
  const actionPanelRef = useRef<ImperativePanelHandle>(null);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (showActionsPanel) {
      const newSizes = [actionsPanelWidth, 100 - actionsPanelWidth];
      setSizes(newSizes);
      panelGroupRef.current?.setLayout(newSizes);
    } else {
      const newSizes = [0, 100];
      setSizes(newSizes);
      panelGroupRef.current?.setLayout(newSizes);
    }
  }, [showActionsPanel, layoutMode]);

  // Determine panel configurations based on visibility
  const getPanelConfigurations = () => {
    const panels = [];

    if (showActionsPanel) {
      panels.push({
        id: "actions-panel",
        size: sizes[0],
        minSize: 10,
        ref: actionPanelRef,
        content: sidebarView,
        visible: true,
      });
    }

    panels.push({
      id: "design-view",
      size: sizes[1],
      minSize: 30,
      content: designView,
      visible: true,
    });

    return panels;
  };

  const wrapperStyle: React.CSSProperties = {
    width: "2px",
    height: "100%",
    position: "absolute",
    zIndex: 10,
    transition: "width 0.3s ease",
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: "230px",
    height: "100%",
    transform: isHovered ? "translateX(0px)" : "translateX(-300px)",
    transition: "width 0.3s ease",
  };

  return (
    <>
      {!showActionsPanel && (
        <div
          style={wrapperStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={actionsPanelStyle}>{sidebarView}</div>
        </div>
      )}

      <PanelGroup
        style={{ height: "100vh" }}
        direction="horizontal"
        ref={panelGroupRef}
      >
        {getPanelConfigurations().map((panel: any, index, array) => (
          <React.Fragment key={panel.id}>
            <Panel
              id={panel.id}
              ref={panel?.ref}
              defaultSize={panel.size}
              minSize={panel.minSize}
              order={index + 1}
              style={{
                minWidth: showActionsPanel ? "315px" : 0,
                transition: "width 0.3s ease",
              }}
            >
              {panel.content}
            </Panel>
            {index < array.length - 1 && (
              <PanelResizeHandle
                style={{
                  width: ".5rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <SVGIcon
                  name="resize"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="icon-xs bg-secondary"
                />
              </PanelResizeHandle>
            )}
          </React.Fragment>
        ))}
      </PanelGroup>
    </>
  );
}
