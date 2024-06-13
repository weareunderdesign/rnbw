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
        }}
      >
        {Object.keys(attributes).map((attribute) => (
          <li
            key={attribute}
            className="gap-m settings-item"
            style={{
              padding: 0,
            }}
            onMouseEnter={() => handleMouseEnter(attribute)}
            onMouseLeave={handleMouseLeave}
          >
            {attributes[attribute] ? (
              <div className="icon-button">
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
              <div className="action-button">
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
              <div className="icon-button">
                <SVGIconII {...{ class: "icon-xs" }}>
                  raincons/checkbox-blank
                </SVGIconII>
              </div>
            )}

            <span className="text-s">{attribute}</span>
            <input
              type="text"
              className="text-s attribute-input"
              style={{ textAlign: "end" }}
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
