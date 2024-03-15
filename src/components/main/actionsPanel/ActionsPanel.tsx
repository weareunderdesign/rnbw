import React, { useEffect, useMemo, useRef, useState } from "react";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import WorkspaceTreeView from "./workspaceTreeView";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";

export default function ActionsPanel() {
  const { showFilePanel } = useAppState();

  const [sizes, setSizes] = useState([0, 100]);
  const filePanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    showFilePanel
      ? filePanelRef.current?.resize(50)
      : filePanelRef.current?.resize(0);
  }, [showFilePanel]);

  return useMemo(() => {
    return (
      <div
        id="ActionsPanel"
        className="border-right background-primary"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <NavigatorPanel />
        <PanelGroup onLayout={setSizes} direction="vertical">
          <Panel
            ref={filePanelRef}
            defaultSize={sizes[0]}
            minSize={showFilePanel ? 10 : 0}
            maxSize={80}
            order={0}
            className={`${showFilePanel && "border-bottom"}`}
          >
            <WorkspaceTreeView />
          </Panel>
          {showFilePanel && (
            <PanelResizeHandle className="panel-resize-vertical" />
          )}
          <Panel defaultSize={sizes[1]} minSize={10} maxSize={100} order={1}>
            <NodeTreeView />
          </Panel>
        </PanelGroup>
        <SettingsPanel />
      </div>
    );
  }, [sizes, showFilePanel]);
}
