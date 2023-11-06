import React, { useCallback, useMemo } from "react";

import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";

import { SettingsPanelProps } from "./types";

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch();

  const onPanelClick = useCallback((e: React.MouseEvent) => {
    dispatch(setActivePanel("settings"));
  }, []);

  return useMemo(() => {
    return <div id="SettingsPanel" onClick={onPanelClick}></div>;
  }, [onPanelClick]);
}
