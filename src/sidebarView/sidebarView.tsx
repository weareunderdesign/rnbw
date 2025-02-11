import React, { useMemo } from "react";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import WorkspaceTreeView from "./workspaceTreeView";

import { useAppState } from "@_redux/useAppState";
import { getFileExtension } from "./navigatorPanel/helpers";

export default function ActionsPanel() {
  const { showFilePanel, selectedNodeUids, currentFileUid, fileTree } =
    useAppState();

  const isCurrentFileHtml = useMemo(() => {
    const fileNode = fileTree[currentFileUid];
    return fileNode && getFileExtension(fileNode) === "html";
  }, [fileTree, currentFileUid]);

  const isSettingsPanelVisible =
    selectedNodeUids.length == 1 && isCurrentFileHtml;

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: showFilePanel
              ? isSettingsPanelVisible
                ? "20%"
                : "100%"
              : "0%",
          }}
        >
          <WorkspaceTreeView />
        </div>
        {isCurrentFileHtml && <NodeTreeView />}

        {isSettingsPanelVisible && <SettingsPanel />}
      </div>
    );
  }, [showFilePanel, selectedNodeUids, isCurrentFileHtml]);
}
