import React, { useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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

  return (
    <>
      {!showActionsPanel && (
        <div className="action-panel-wrapper">{actionPanel}</div>
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
