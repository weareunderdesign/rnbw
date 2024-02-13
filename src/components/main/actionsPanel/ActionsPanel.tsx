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
        className="border radius-s background-primary shadow"
      >
        <NavigatorPanel />
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(auto-fit, minmax(50px, 1fr))",
            height: "100%",
          }}
        >
          <WorkspaceTreeView />
          <NodeTreeView />
        </div>
        {false && <SettingsPanel />}
      </div>
    );
  }, []);
}
