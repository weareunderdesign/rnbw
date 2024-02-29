import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";

import { SettingsPanelProps } from "./types";

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch();

  const onPanelClick = useCallback((e: React.MouseEvent) => {
    dispatch(setActivePanel("settings"));
  }, []);

  return useMemo(() => {
    return (
      <div
        id="SettingsPanel"
        className="border-top border-bottom padding-m"
        style={{
          height: "45px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onClick={onPanelClick}
      >
        <span className="text-s">Settings</span>
        <SVGIconI {...{ class: "icon-xs" }}>plus</SVGIconI>
      </div>
    );
  }, [onPanelClick]);
}
