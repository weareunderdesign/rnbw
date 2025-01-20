import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIcon } from "@src/components";

import { Attribute, SettingsViewProps } from "../settingsPanel/types";
import { useAppState } from "@_redux/useAppState";
import useRnbw from "@_services/useRnbw";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null);
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

  const handleInputMouseEnter = (attribute: string) => {
    setHoveredInput(attribute);
  };

  const handleInputMouseLeave = () => {
    setHoveredInput(null);
  };

  const handleInputFocus = (attribute: string) => {
    setFocusedInput(attribute);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  const iconButtonStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  };

  const settingsItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
  };

  const inputStyle = (attribute: string): React.CSSProperties => ({
    textAlign: "end",
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    boxShadow:
      hoveredInput === attribute
        ? "0 1px 0 0 white"
        : focusedInput === attribute
          ? "0 1px 0 0 white"
          : "none",
  });

  return (
    <div
      id="SettingsView"
      className="padding-s"
      onClick={() =>
        activePanel !== "settings" && dispatch(setActivePanel("settings"))
      }
    >
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
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
                <SVGIcon
                  name="checkbox"
                  className="icon-xs"
                  onClick={() => cleanUpValue(attribute)}
                  key={attributes[attribute]}
                />
              </div>
            ) : hoveredAttr === attribute ? (
              <div style={iconButtonStyle}>
                <SVGIcon
                  name="cross"
                  className="icon-xs"
                  onClick={() => handleDelete(attribute)}
                  key={attributes[attribute]}
                />
              </div>
            ) : (
              <div style={iconButtonStyle}>
                <SVGIcon
                  name="checkbox-blank"
                  className="icon-xs"
                  key={attributes[attribute]}
                />
              </div>
            )}

            <span className="text-s">{attribute}</span>
            <input
              type="text"
              className="text-s"
              style={inputStyle(attribute)}
              value={(attributes[attribute] || "") as string}
              onBlur={() => {
                handleInputBlur();
                rnbw.elements.updateSettings({
                  settings: {
                    ...rnbw.elements.getElementSettings(),
                    [attribute]: attributes[attribute],
                  },
                });
              }}
              onChange={(e) => handleChange(e, attribute)}
              onKeyDown={(e) => handleKeyDown(e, attribute)}
              onMouseEnter={() => handleInputMouseEnter(attribute)}
              onMouseLeave={handleInputMouseLeave}
              onFocus={() => handleInputFocus(attribute)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
