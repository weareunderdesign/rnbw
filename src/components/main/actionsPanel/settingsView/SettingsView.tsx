import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI, SVGIconII, SVGIconIII } from "@_components/common";

import { Attribute, SettingsViewProps } from "../settingsPanel/types";
import { useAppState } from "@_redux/useAppState";
import useRnbw from "@_services/useRnbw";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { activePanel } = useAppState();

  const rnbw = useRnbw();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, attribute: string) => {
      setAttributes((prev: Attribute) => ({
        ...prev,
        [attribute]: e.target.value,
      }));
    },
    [],
  );
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>, attribute: string) => {
      if (e.key !== "Enter") return;
      const existingAttributesObj = rnbw.elements.getElementSettings();
      const result = await rnbw.elements.updateSettings({
        settings: {
          ...existingAttributesObj,
          [`${attribute}`]: attributes[attribute],
        },
      });
      if (result?.settings && !result?.isSuccess)
        setAttributes(result.settings);
    },
    [attributes],
  );

  const cleanUpValue = useCallback(
    async (attribute: string) => {
      const existingAttributesObj = rnbw.elements.getElementSettings();
      const updatedAttribsObj = await rnbw.elements.updateSettings({
        settings: {
          ...existingAttributesObj,
          [`${attribute}`]: "",
        },
      });
      updatedAttribsObj?.settings && setAttributes(updatedAttribsObj.settings);
    },
    [rnbw.elements, setAttributes],
  );

  const handleDelete = (attribute: string) => {
    const existingAttributesObj = rnbw.elements.getElementSettings();
    delete existingAttributesObj[attribute];
    rnbw.elements.updateSettings({ settings: existingAttributesObj });
    setAttributes(existingAttributesObj);
  };

  const handleMouseEnter = (attribute: string) => {
    setHoveredAttr(attribute);
  };
  const handleMouseLeave = () => {
    setHoveredAttr(null);
  };

  const iconButtonStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px',
  };

  const settingsItemStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: '20px 50px 1fr',
    alignItems: 'center',
    padding: 0,
    gap: '12px', // Добавлено для соответствия классу gap-m
  };

  return (
    <div
      id="SettingsView"
      onClick={() =>
        activePanel !== "settings" && dispatch(setActivePanel("settings"))
      }
    >
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "0px",
          listStyleType: "none",
        }}
      >
        {Object.keys(attributes).map((attribute) => (
          <li
            key={attribute}
            style={settingsItemStyle}
            onMouseEnter={() => handleMouseEnter(attribute)}
            onMouseLeave={handleMouseLeave}
          >
            {attributes[attribute] ? (
              <div style={iconButtonStyle}>
                <SVGIconIII
                  {...{
                    class: "icon-xs",
                    onClick: () => cleanUpValue(attribute),
                  }}
                >
                  raincons/checkbox
                </SVGIconIII>
              </div>
            ) : hoveredAttr === attribute ? (
              <div style={iconButtonStyle}>
                <SVGIconI
                  {...{
                    class: "icon-xs",
                    onClick: () => handleDelete(attribute),
                  }}
                >
                  raincons/cross
                </SVGIconI>
              </div>
            ) : (
              <div style={iconButtonStyle}>
                <SVGIconII {...{ class: "icon-xs" }}>
                  raincons/checkbox-blank
                </SVGIconII>
              </div>
            )}

            <span style={{ fontSize: '14px' }}>{attribute}</span>
            <input
              type="text"
              style={{ 
                fontSize: '14px',
                textAlign: "end",
                border: 'none',
                background: 'transparent',
                outline: 'none',
              }}
              value={(attributes[attribute] || "") as string}
              onBlur={() =>
                rnbw.elements.updateSettings({
                  settings: {
                    ...rnbw.elements.getElementSettings(),
                    [attribute]: attributes[attribute],
                  },
                })
              }
              onChange={(e) => handleChange(e, attribute)}
              onKeyDown={(e) => handleKeyDown(e, attribute)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};