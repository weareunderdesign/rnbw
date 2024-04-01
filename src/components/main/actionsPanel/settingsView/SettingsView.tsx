import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI, SVGIconII, SVGIconIII } from "@_components/common";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { SettingsViewProps } from "../settingsPanel/types";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const dispatch = useDispatch();
  const { changeAttribute, deleteAttribute } = useAttributeHandler();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      setAttributes((prev: Record<string, string>) => ({
        ...prev,
        [key]: e.target.value,
      }));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
      if (e.key !== "Enter") return;
      changeAttribute(key, attributes[key] as string);
    },
    [attributes, changeAttribute],
  );

  const cleanUpValue = useCallback(
    (key: string) => {
      changeAttribute(key, "", () =>
        setAttributes((prev: Record<string, string>) => ({
          ...prev,
          [key]: "",
        })),
      );
    },
    [setAttributes],
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div id="SettingsView" onClick={() => dispatch(setActivePanel("settings"))}>
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {Object.keys(attributes).map((key) => (
          <li
            key={key}
            className="gap-m"
            style={{
              display: "flex",
              padding: 0,
              alignItems: "center",
              height: "20px",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {attributes[key] ? (
              <div className="icon-button">
                <SVGIconIII
                  {...{ class: "icon-xs", onClick: () => cleanUpValue(key) }}
                >
                  checkbox
                </SVGIconIII>
              </div>
            ) : isHovered ? (
              <div className="action-button">
                <SVGIconI
                  {...{
                    class: "icon-xs",
                    onClick: () =>
                      deleteAttribute(key, attributes[key] as string, () =>
                        setAttributes((prev: Record<string, string>) => {
                          delete prev[key];
                          return { ...prev };
                        }),
                      ),
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

            <div
              className="gap-m"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="text-s">{key}</span>
              <input
                type="text"
                className="text-s attribute-input"
                style={{
                  justifySelf: "end",
                  minWidth: "20px",
                  maxWidth: "90%",
                }}
                value={(attributes[key] || "") as string}
                onBlur={() => changeAttribute(key, attributes[key] as string)}
                onChange={(e) => handleChange(e, key)}
                onKeyDown={(e) => handleKeyDown(e, key)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
