import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";

import { SettingsView } from "../settingsView/SettingsView";
import { SettingsForm } from "../settingsView/SettingsForm";

export default function SettingsPanel() {
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
          <div className="flex justify-stretch align-center">
            <div className="text-s">Settings</div>

            {!showForm && (
              <div
                className="action-button"
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
