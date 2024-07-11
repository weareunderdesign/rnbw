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
import { getFileExtension } from "./navigatorPanel/helpers";

export default function ActionsPanel() {
  const { showFilePanel, selectedNodeUids, currentFileUid, fileTree } =
    useAppState();

  const [sizes, setSizes] = useState([0, 100]);
  const filePanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    showFilePanel
      ? filePanelRef.current?.resize(20)
      : filePanelRef.current?.resize(0);
  }, [showFilePanel]);

  const isCurrentFileHtml = useMemo(() => {
    const fileNode = fileTree[currentFileUid];
    return fileNode && getFileExtension(fileNode) === "html";
  }, [fileTree, currentFileUid]);

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
            maxSize={50}
            order={0}
            className={`${showFilePanel && "border-bottom"}`}
          >
            <WorkspaceTreeView />
          </Panel>
          {showFilePanel && (
            <PanelResizeHandle  style={{ width: 0 }} />
          )}
          <Panel defaultSize={sizes[1]} minSize={10} maxSize={100} order={1}>
            {isCurrentFileHtml && <NodeTreeView />}
          </Panel>
        </PanelGroup>
        {selectedNodeUids.length == 1 && isCurrentFileHtml && <SettingsPanel />}
      </div>
    );
  }, [sizes, showFilePanel, selectedNodeUids, isCurrentFileHtml]);
}


