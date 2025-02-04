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

const actionsPanelWidth = 10;
const defaultCodeViewWidth = 30;

export default function ResizablePanels({
  sidebarView,
  designView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();
  const [sizes, setSizes] = useState([actionsPanelWidth, 0]);
  const actionPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [codeViewWidth, setCodeViewWidth] = useState(defaultCodeViewWidth);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    showActionsPanel
      ? showCodeView
        ? panelGroupRef.current?.setLayout([
            actionsPanelWidth,
            100 - actionsPanelWidth - sizes[0],
          ])
        : actionPanelRef.current?.resize(actionsPanelWidth)
      : showCodeView
        ? panelGroupRef.current?.setLayout([0, 100 - sizes[0]])
        : panelGroupRef.current?.setLayout([0, 100]);
  }, [showActionsPanel]);

  useEffect(() => {
    showCodeView
      ? showActionsPanel
        ? panelGroupRef.current?.setLayout([sizes[0], 100 - sizes[0]])
        : codeViewRef.current?.resize(codeViewWidth)
      : showActionsPanel
        ? codeViewRef.current?.resize(0)
        : panelGroupRef.current?.setLayout([0, 100]);
  }, [showCodeView]);

  const wrapperStyle: React.CSSProperties = {
    width: "2px",
    height: "100%",
    position: "absolute",
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: "240px",
    height: "100%",
    transform: isHovered ? "translateX(0px)" : "translateX(-300px)",
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
        <Panel
          ref={actionPanelRef}
          defaultSize={sizes[0]}
          minSize={showActionsPanel ? 10 : 0}
          order={1}
          style={{
            minWidth: showActionsPanel ? "330px" : 0,
          }}
          onResize={(size) => {
            setSizes([size, sizes[1]]);
          }}
        >
          {showActionsPanel && sidebarView}
        </Panel>
        <PanelResizeHandle style={{ width: 0 }} />

        <PanelResizeHandle style={{ width: 3 }} />
        <Panel
          defaultSize={sizes[2]}
          minSize={30}
          order={3}
          onResize={(size) => {
            setSizes([sizes[0], sizes[1], size]);
          }}
        >
          {designView}
        </Panel>
        {/* <Panel
          ref={codeViewRef}
          defaultSize={sizes[1]}
          minSize={showCodeView ? 10 : 0}
          order={2}
          style={{
            minWidth: showCodeView ? "256px" : 0,
          }}
          onResize={(size) => {
            setSizes([sizes[0], size, sizes[2]]);
          }}
        >
          {codeView}
        </Panel> */}
      </PanelGroup>
      {showCodeView && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "40%", // Adjust width as needed
            height: "100%",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <PanelGroup direction="horizontal">
            <Panel defaultSize={100} />
            <PanelResizeHandle style={{ width: 3 }} />
            <Panel
              defaultSize={codeViewWidth}
              minSize={defaultCodeViewWidth}
              onResize={(size) => {
                setCodeViewWidth(size);
              }}
            >
              {codeView}
            </Panel>
          </PanelGroup>
        </div>
      )}
    </>
  );
}
