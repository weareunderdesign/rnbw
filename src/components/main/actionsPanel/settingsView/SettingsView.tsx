import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { DataSequencedUid, StageNodeIdAttr } from "@_node/file";
import { useAppState } from "@_redux/useAppState";
import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI } from "@_components/common";
import { useAttributeHandler } from "./hooks/useAttributeHandler";

let excludedAttributes: string[] = [StageNodeIdAttr, DataSequencedUid];

export const SettingsView = () => {
  const dispatch = useDispatch();

  const { nodeTree, nFocusedItem } = useAppState();
  const { changeAttribute, deleteAttribute } = useAttributeHandler();

  const filteredAttributes = useMemo(
    () =>
      Object.entries(nodeTree[nFocusedItem]?.data?.attribs ?? {})
        .filter(([key]) => !excludedAttributes.includes(key))
        .reduce(
          (obj, [key, value]) => {
            obj[key] = value as string | boolean;
            return obj;
          },
          {} as Record<string, string | boolean>,
        ),
    [nFocusedItem, nodeTree],
  );
  const [attrArray, setAttrArray] = useState({ ...filteredAttributes });

  useEffect(() => {
    setAttrArray({ ...filteredAttributes });
  }, [filteredAttributes]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      setAttrArray({ ...attrArray, [key]: e.target.value });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
      if (e.key !== "Enter") return;
      changeAttribute(key, attrArray[key] as string);
    },
    [attrArray],
  );

  return (
    <div id="SettingsView" onClick={() => dispatch(setActivePanel("settings"))}>
      <ul>
        {Object.keys(filteredAttributes).map((key) => (
          <li key={key} className="settings-item gap-m padding-m">
            <span className="text-s">{key}</span>

            <input
              className="text-s attribute-input"
              value={(attrArray[key] || "") as string}
              onBlur={() => changeAttribute(key, attrArray[key] as string)}
              onChange={(e) => handleChange(e, key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
            />

            <div
              className="action-button"
              onClick={() => deleteAttribute(key, attrArray[key] as string)}
            >
              <SVGIconI {...{ class: "icon-xs" }}>cross</SVGIconI>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
