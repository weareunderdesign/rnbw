import React, { useContext, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from "@_redux/main";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import { ActionsPanelProps } from "./types";
import WorkspaceTreeView from "./workspaceTreeView";

export default function ActionsPanel(props: ActionsPanelProps) {
  const { showActionsPanel } = useContext(MainContext);

  return useMemo(() => {
    return (
      <>
        <div
          id="ActionsPanel"
          className="border radius-s background-primary shadow"
          style={{
            position: "absolute",
            top: props.offsetTop,
            left: props.offsetLeft,
            width: props.width,
            height: props.height,

            overflow: "hidden",

            ...(showActionsPanel
              ? {}
              : { width: "0", overflow: "hidden", border: "none" }),
          }}
        >
          <NavigatorPanel />
          <WorkspaceTreeView />
          <NodeTreeView />
          {false && <SettingsPanel />}
        </div>
      </>
    );
  }, [props, showActionsPanel]);
}
