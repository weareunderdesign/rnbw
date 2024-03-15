import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { StageNodeIdAttr, DataSequencedUid } from "@_node/file";
import { useAppState } from "@_redux/useAppState";
import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";

import { SettingsView } from "../settingsView/SettingsView";
import { SettingsForm } from "../settingsView/SettingsForm";
import { PanelHeader } from "@_components/common/panelHeader";

const excludedAttributes: string[] = [StageNodeIdAttr, DataSequencedUid];

export default function SettingsPanel() {
  const dispatch = useDispatch();
  const { nodeTree, nFocusedItem } = useAppState();

  const [attributes, setAttributes] = useState({});
  const [showForm, setShowForm] = useState(false);

  const attributesArray = useMemo(() => Object.keys(attributes), [attributes]);

  useEffect(() => {
    const filteredAttributes = nodeTree[nFocusedItem]?.data?.attribs || {};
    const filtered = Object.fromEntries(
      Object.entries(filteredAttributes)
        .filter(([key]) => !excludedAttributes.includes(key))
        .reverse(),
    );
    setAttributes(filtered);
  }, [nodeTree, nFocusedItem]);

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("settings"));
  }, []);

  return useMemo(() => {
    return (
      <div
        id="Settings"
        onClick={onPanelClick}
        className="border-bottom padding-m"
      >
        <PanelHeader>
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
        </PanelHeader>

        {showForm && (
          <SettingsForm
            setShowForm={setShowForm}
            setAttributes={setAttributes}
          />
        )}

        {!!attributesArray.length && (
          <SettingsView attributes={attributes} setAttributes={setAttributes} />
        )}
      </div>
    );
  }, [onPanelClick, showForm, attributes, attributesArray]);
}
