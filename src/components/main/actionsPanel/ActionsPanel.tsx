import React, { useMemo } from "react";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import WorkspaceTreeView from "./workspaceTreeView";

export default function ActionsPanel() {
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
            display: "grid",
            gridTemplateRows: "repeat(auto-fit, minmax(50px, 1fr))",
            height: "100%",
            flexGrow: 1,
            overflowY: "auto",
          }}
        >
          <WorkspaceTreeView />
          <NodeTreeView />
        </div>
        <SettingsPanel />
      </div>
    );
  }, []);
}
