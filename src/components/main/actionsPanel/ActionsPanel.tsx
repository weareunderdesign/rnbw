import React, { useEffect, useMemo } from "react";

import { useSelector } from "react-redux";

import { showActionsPanelSelector } from "@_redux/main/processor";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import { ActionsPanelProps } from "./types";
import WorkspaceTreeView from "./workspaceTreeView";

export default function ActionsPanel({ ...props }: ActionsPanelProps) {
  const showActionsPanel = useSelector(showActionsPanelSelector);
  useEffect(() => console.log(showActionsPanel), [showActionsPanel]);
  return useMemo(() => {
    return (
      <>
        <div
          id="ActionsPanel"
          className="border radius-s background-primary shadow"
          style={{
            position: "absolute",
            top: props.top,
            left: props.left,
            width: props.width,
            height: props.height,

            overflow: "hidden",

            ...(showActionsPanel
              ? {}
              : { width: "0", overflow: "hidden", border: "none" }),
          }}
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
      </>
    );
  }, [props, showActionsPanel]);
}
