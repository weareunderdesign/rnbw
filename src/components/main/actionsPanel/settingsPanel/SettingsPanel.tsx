import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { StageNodeIdAttr, DataSequencedUid } from "@_node/file";
import { useAppState } from "@_redux/useAppState";
import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";

import { SettingsView } from "../settingsView/SettingsView";
import { SettingsForm } from "../settingsView/SettingsForm";
import { PanelHeader } from "@_components/common/panelHeader";
import { Attribute } from "./types";

const excludedAttributes: string[] = [StageNodeIdAttr, DataSequencedUid];

export default function SettingsPanel() {
  const dispatch = useDispatch();
  const { nodeTree, selectedNodeUids } = useAppState();
  const [attributes, setAttributes] = useState<Attribute>({});

  const [showForm, setShowForm] = useState(false);
  const [isHover, setIsHovered] = useState(false);

  useEffect(() => {
    const multipleAttr = selectedNodeUids.reduce((acc: Attribute, uid) => {
      acc[uid] = { ...nodeTree[uid]?.data?.attribs } || {};
      excludedAttributes.map((item) => {
        if (acc[uid][item]) delete acc[uid][item];
      });
      return acc;
    }, {});

    setAttributes(multipleAttr);
  }, [nodeTree, selectedNodeUids]);

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("settings"));
  }, []);
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return useMemo(() => {
    return (
      <div
        id="SettingsPanel"
        onClick={onPanelClick}
        className="border-bottom padding-m"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PanelHeader>
          <div className="text-s">Settings</div>
          <div
            className={`action-button ${!isHover && "action-button-hidden"}`}
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

        {Object.values(attributes).some((obj) => !!Object.keys(obj).length) && (
          <SettingsView attributes={attributes} setAttributes={setAttributes} />
        )}
      </div>
    );
  }, [onPanelClick, showForm, attributes, isHover]);
}
