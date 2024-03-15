import React, { useCallback } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { SettingsViewProps } from "../settingsPanel/types";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
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
          <li key={key} className="settings-item gap-m" style={{ padding: 0 }}>
            <span className="text-s">{key}</span>

            <input
              className="text-s attribute-input"
              value={(attributes[key] || "") as string}
              onBlur={() => changeAttribute(key, attributes[key] as string)}
              onChange={(e) => handleChange(e, key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
            />

            <div
              className="action-button"
              onClick={() =>
                deleteAttribute(key, attributes[key] as string, () =>
                  setAttributes((prev: Record<string, string>) => {
                    delete prev[key];
                    return { ...prev };
                  }),
                )
              }
            >
              <SVGIconI {...{ class: "icon-xs" }}>cross</SVGIconI>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
