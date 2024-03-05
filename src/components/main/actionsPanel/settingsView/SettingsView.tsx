import React, { useCallback, useEffect, useMemo, useState } from "react";

import { StageNodeIdAttr } from "@_node/file";
import { useAppState } from "@_redux/useAppState";

import { useDispatch } from "react-redux";
import { setActivePanel } from "@_redux/main/processor";
import { useAttributeHandler } from "./hooks/useAttributeHandler";

let excludedAttributes: string[] = [StageNodeIdAttr];

export const SettingsView = () => {
  const { nodeTree, nFocusedItem } = useAppState();
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

  const dispatch = useDispatch();
  const { changeAttribute } = useAttributeHandler();

  const [attrArray, setAttrArray] = useState({ ...filteredAttributes });

  useEffect(() => {
    setAttrArray({ ...filteredAttributes });
  }, [filteredAttributes]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
      setAttrArray({ ...attrArray, [key]: event.target.value });
    },
    [],
  );

  return (
    <div id="SettingsView" onClick={() => dispatch(setActivePanel("settings"))}>
      <ul>
        {Object.keys(filteredAttributes).map((key) => (
          <li
            key={key}
            className="align-center justify-start padding-m gap-m"
            style={{ height: "38px" }}
          >
            <p className="text-s" style={{ minWidth: "50px" }}>
              {key}
            </p>

            <input
              className="text-s attribute-input"
              value={(attrArray[key] || "") as string}
              onBlur={() => changeAttribute(key, attrArray[key] as string)}
              onChange={(e) => handleChange(e, key)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
