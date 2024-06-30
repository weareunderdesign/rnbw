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
  const { nodeTree, nFocusedItem, activePanel } = useAppState();
  const [attributes, setAttributes] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [isHover, setIsHovered] = useState(false);
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
    activePanel !== "settings" && dispatch(setActivePanel("settings"));
  }, [activePanel]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return useMemo(() => {
    const panelStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      borderBottom: "1px solid var(--color-border)",
      padding: "16px",
    };

    const buttonStyle: React.CSSProperties = {
      visibility: isHover ? "visible" : "hidden",
      padding: "4px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
    };

    return (
      <div
        id="SettingsPanel"
        onClick={onPanelClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={panelStyle}
      >
        <PanelHeader>
          <div style={{ fontSize: "14px" }}>Settings</div>
          <div
            style={buttonStyle}
            onClick={() => {
              setShowForm(true);
            }}
          >
            <SVGIconI className="icon-xs">raincons/plus</SVGIconI>
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
  }, [onPanelClick, showForm, attributes, isHover, attributesArray]);
}