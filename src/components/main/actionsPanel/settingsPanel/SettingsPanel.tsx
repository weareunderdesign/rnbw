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

  const [isHover, setIsHovered] = useState(false);

  useEffect(() => {
    const settingsPanel = document.getElementById("SettingsPanel");

    if (!settingsPanel) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    settingsPanel.addEventListener("mouseenter", handleMouseEnter);
    settingsPanel.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      settingsPanel.removeEventListener("mouseenter", handleMouseEnter);
      settingsPanel.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return useMemo(() => {
    return (
      <div
        id="SettingsPanel"
        onClick={onPanelClick}
        className="border-bottom padding-m"
      >
        <PanelHeader>
          <div className="text-s">Settings</div>
          <div
            className={`action-button ${!isHover && "action-button-hidden"}`}
            // className="action-button"
            onClick={() => {
              setShowForm(true);
            }}
          >
            <SVGIconI {...{ class: "icon-xs" }}>plus</SVGIconI>
          </div>
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
  }, [onPanelClick, showForm, attributes, attributesArray, isHover]);
}
