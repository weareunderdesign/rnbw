import React, { useCallback, useContext, useMemo } from "react";

import { MainContext } from "@_redux/main";

import { SettingsPanelProps } from "./types";

export default function SettingsPanel(props: SettingsPanelProps) {
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { setActivePanel } = useContext(MainContext);
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel("settings");
  }, []);

  return useMemo(() => {
    return <div id="SettingsPanel" onClick={onPanelClick}></div>;
  }, [onPanelClick]);
}
