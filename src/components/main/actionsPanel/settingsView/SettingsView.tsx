import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI, SVGIconII, SVGIconIII } from "@_components/common";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { Attribute, SettingsViewProps } from "../settingsPanel/types";
import { useAppState } from "@_redux/useAppState";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { activePanel } = useAppState();
  const { changeAttribute, deleteAttribute } = useAttributeHandler();

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
    (e: React.KeyboardEvent<HTMLInputElement>, attribute: string) => {
      if (e.key !== "Enter") return;
      changeAttribute({
        attrName: attribute,
        attrValue: attributes[attribute],
      });
    },
    [attributes, changeAttribute],
  );

  const cleanUpValue = useCallback(
    (attribute: string) => {
      changeAttribute({
        attrName: attribute,
        attrValue: "",
        cb: () =>
          setAttributes((prev: Attribute) => ({
            ...prev,
            [attribute]: "",
          })),
      });
    },
    [changeAttribute],
  );

  const handleDelete = (attribute: string) =>
    deleteAttribute({
      attrName: attribute,
      attrValue: attributes[attribute] as string,
      cb: () =>
        setAttributes((prev: Attribute) => {
          delete prev[attribute];
          return { ...prev };
        }),
    });

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
                  checkbox
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
                  cross
                </SVGIconI>
              </div>
            ) : (
              <div className="icon-button">
                <SVGIconII {...{ class: "icon-xs" }}>checkbox-blank</SVGIconII>
              </div>
            )}

            <span className="text-s">{attribute}</span>
            <input
              type="text"
              className="text-s attribute-input"
              style={{ textAlign: "end" }}
              value={(attributes[attribute] || "") as string}
              onBlur={() =>
                changeAttribute({
                  attrName: attribute,
                  attrValue: attributes[attribute],
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
