import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { SVGIconI, SVGIconII, SVGIconIII } from "@_components/common";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { SettingsViewProps } from "../settingsPanel/types";
import { useAppState } from "@_redux/useAppState";
import { TNodeUid } from "@_node/index";

export const SettingsView = ({
  attributes,
  setAttributes,
}: SettingsViewProps) => {
  const [isHovered, setIsHovered] = useState<TNodeUid | null>(null);

  const dispatch = useDispatch();
  const { selectedNodeUids } = useAppState();
  const { changeAttribute, deleteAttribute } = useAttributeHandler();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, uid: TNodeUid, key: string) => {
      setAttributes((prev: Record<string, Record<string, string>>) => ({
        ...prev,
        [uid]: {
          ...prev[uid],
          [key]: e.target.value,
        },
      }));
    },
    [],
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, uid: TNodeUid, key: string) => {
      if (e.key !== "Enter") return;
      changeAttribute({
        uid,
        attrName: key,
        attrValue: attributes[uid][key],
      });
    },
    [attributes, changeAttribute],
  );

  const cleanUpValue = useCallback(
    (uid: TNodeUid, key: string) => {
      console.log({ uid, attrName: key, attrValue: "" }, "cleanUpValue");

      changeAttribute({
        uid,
        attrName: key,
        attrValue: "",
        cb: () =>
          setAttributes((prev: Record<string, Record<string, string>>) => ({
            ...prev,
            [uid]: {
              ...prev[uid],
              [key]: "",
            },
          })),
      });
    },
    [changeAttribute],
  );

  const handleDelete = (uid: TNodeUid, key: string) =>
    deleteAttribute({
      uid,
      attrName: key,
      attrValue: attributes[uid][key] as string,
      cb: () =>
        setAttributes((prev: Record<string, Record<string, string>>) => {
          delete prev[uid][key];
          return { ...prev };
        }),
    });

  const handleMouseEnter = (uid: TNodeUid) => {
    setIsHovered(uid);
  };
  const handleMouseLeave = () => {
    setIsHovered(null);
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
        {selectedNodeUids.map(
          (uid) =>
            attributes?.[uid] &&
            !!Object.entries(attributes[uid]).length &&
            Object.keys(attributes[uid])
              .reverse()
              .map((key) => (
                <li
                  key={key}
                  className="gap-m settings-item"
                  style={{
                    padding: 0,
                  }}
                  onMouseEnter={() => handleMouseEnter(uid)}
                  onMouseLeave={handleMouseLeave}
                >
                  {attributes[uid][key] ? (
                    <div className="icon-button">
                      <SVGIconIII
                        {...{
                          class: "icon-xs",
                          onClick: () => cleanUpValue(uid, key),
                        }}
                      >
                        checkbox
                      </SVGIconIII>
                    </div>
                  ) : isHovered === uid ? (
                    <div className="action-button">
                      <SVGIconI
                        {...{
                          class: "icon-xs",
                          onClick: () => handleDelete(uid, key),
                        }}
                      >
                        cross
                      </SVGIconI>
                    </div>
                  ) : (
                    <div className="icon-button">
                      <SVGIconII {...{ class: "icon-xs" }}>
                        checkbox-blank
                      </SVGIconII>
                    </div>
                  )}

                  <span className="text-s">{key}</span>
                  <input
                    type="text"
                    className="text-s attribute-input"
                    style={{ textAlign: "end" }}
                    value={(attributes[uid][key] || "") as string}
                    onBlur={() =>
                      changeAttribute({
                        uid,
                        attrName: key,
                        attrValue: attributes[uid][key],
                      })
                    }
                    onChange={(e) => handleChange(e, uid, key)}
                    onKeyDown={(e) => handleKeyDown(e, uid, key)}
                  />
                </li>
              )),
        )}
      </ul>
    </div>
  );
};
