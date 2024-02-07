import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";

export default function ResizablePanels({
  actionPanel,
  stageView,
  codeView,
}: {
  actionPanel: any;
  stageView: any;
  codeView: any;
}) {
  const { showActionsPanel, showCodeView } = useAppState();

  const containerWidth = document.documentElement.clientWidth;
  const actionsPanelWidth = (240 / containerWidth) * 100;

  return (
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
                style={{ padding: "0px 12px 12px 0px" }}
              >
                {codeView}
              </Panel>
            </>
          )}
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
