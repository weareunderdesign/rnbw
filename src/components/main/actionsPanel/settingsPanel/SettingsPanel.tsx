import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";

import { SettingsPanelProps } from "./types";
import { SettingsView } from "../settingsView/SettingsView";
import { SettingsForm } from "../settingsView/SettingsForm";

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch();

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("settings"));
  }, []);

  const [showForm, setShowForm] = useState(false);

  return useMemo(() => {
    return (
      <>
        <div
          id="SettingsPanel"
          className="border-top border-bottom padding-m"
          onClick={onPanelClick}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="text-s">Settings</div>

            {!showForm && (
              <div
                onClick={() => {
                  setShowForm(true);
                }}
              >
                <SVGIconI {...{ class: "icon-xs" }}>plus</SVGIconI>
              </div>
            )}
          </div>
          {showForm && <SettingsForm setShowForm={setShowForm} />}
        </div>

        <SettingsView />
      </>
    );
  }, [onPanelClick, showForm]);
}
