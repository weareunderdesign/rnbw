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
const codeViewWidth = 30;

export default function ResizablePanels({
  sidebarView,
  stageView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();
  const [sizes, setSizes] = useState([actionsPanelWidth, codeViewWidth, 0]);
  const actionPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    showActionsPanel
      ? showCodeView
        ? panelGroupRef.current?.setLayout([
            actionsPanelWidth,
            sizes[1],
            100 - actionsPanelWidth - sizes[1],
          ])
        : actionPanelRef.current?.resize(actionsPanelWidth)
      : showCodeView
      ? panelGroupRef.current?.setLayout([0, sizes[1], 100 - sizes[1]])
      : panelGroupRef.current?.setLayout([0, 0, 100]);
  }, [showActionsPanel]);

  useEffect(() => {
    showCodeView
      ? showActionsPanel
        ? panelGroupRef.current?.setLayout([
            sizes[0],
            codeViewWidth,
            100 - codeViewWidth - sizes[0],
          ])
        : codeViewRef.current?.resize(codeViewWidth)
      : showActionsPanel
      ? codeViewRef.current?.resize(0)
      : panelGroupRef.current?.setLayout([0, 0, 100]);
  }, [showCodeView]);

  const wrapperStyle: React.CSSProperties = {
    width: '2px',
    height: '100%',
    position: 'absolute',
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: '240px',
    height: '100%',
    transform: isHovered ? 'translateX(0px)' : 'translateX(-300px)',
  };

  return (
    <>
      {!showActionsPanel && (
        <div 
          style={wrapperStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={actionsPanelStyle}>
            {sidebarView}
          </div>
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
            minWidth: showActionsPanel ? "240px" : 0,
          }}
          onResize={(size) => {
            setSizes([size, sizes[1], sizes[2]]);
          }}
        >
          {showActionsPanel && sidebarView}
        </Panel>
        <PanelResizeHandle style={{ width: 0 }} />
        <Panel
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
        </Panel>
        <PanelResizeHandle style={{ width: 3 }} />
        <Panel
          defaultSize={sizes[2]}
          minSize={30}
          order={3}
          onResize={(size) => {
            setSizes([sizes[0], sizes[1], size]);
          }}
        >
          {stageView}
        </Panel>
      </PanelGroup>
    </>
  );
}