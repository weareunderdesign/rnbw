import React, { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
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
  const { showActionsPanel, showCodeView } = useAppState();

  const [sizes, setSizes] = useState([actionsPanelWidth, 50, codeViewWidth]);

  const actionPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    showActionsPanel
      ? actionPanelRef.current?.resize(actionsPanelWidth)
      : actionPanelRef.current?.resize(0);
  }, [showActionsPanel]);

  useEffect(() => {
    showCodeView
      ? codeViewRef.current?.resize(codeViewWidth)
      : codeViewRef.current?.resize(0);
  }, [showCodeView]);

  return (
    <>
      {!showActionsPanel && (
        <div className="action-panel-wrapper">{actionPanel}</div>
      )}

      <PanelGroup
        style={{ height: "100vh" }}
        onLayout={setSizes}
        direction="horizontal"
      >
        <Panel
          ref={actionPanelRef}
          defaultSize={sizes[0]}
          minSize={showActionsPanel ? 5 : 0}
          maxSize={50}
          order={1}
        >
          {showActionsPanel && actionPanel}
        </Panel>

        <PanelResizeHandle className="panel-resize" />

        <Panel defaultSize={sizes[1]} minSize={30} order={2}>
          {stageView}
        </Panel>

        <PanelResizeHandle className="panel-resize" />

        <Panel
          ref={codeViewRef}
          defaultSize={sizes[2]}
          minSize={showCodeView ? 5 : 0}
          maxSize={50}
          order={3}
        >
          {codeView}
        </Panel>
      </PanelGroup>
    </>
  );
}
