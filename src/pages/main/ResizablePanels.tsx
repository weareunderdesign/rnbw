import React, { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { ResizablePanelsProps } from "./types";

const actionsPanelWidth = 10;
const codeViewWidth = 30;

export default function ResizablePanels({
  actionPanel,
  stageView,
  codeView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();

  const [sizes, setSizes] = useState([actionsPanelWidth, codeViewWidth, 0]);

  const actionPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

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

  return (
    <>
      {!showActionsPanel && (
        <div className="action-panel-wrapper">{actionPanel}</div>
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
          {showActionsPanel && actionPanel}
        </Panel>
        <PanelResizeHandle className="panel-resize" />
        <Panel
          ref={codeViewRef}
          defaultSize={sizes[1]}
          minSize={showCodeView ? 10 : 0}
          order={2}
          style={{
            minWidth: showCodeView ? "480px" : 0,
          }}
          onResize={(size) => {
            setSizes([sizes[0], size, sizes[2]]);
          }}
        >
          {codeView}
        </Panel>
        <PanelResizeHandle
          className={`panel-resize ${showCodeView ? "panel-resize-stage" : ""}`}
        />
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
