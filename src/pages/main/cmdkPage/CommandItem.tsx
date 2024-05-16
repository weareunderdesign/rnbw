import React, { useMemo } from "react";
import { Command } from "cmdk";
import { useAppState } from "@_redux/useAppState";
import { TCmdkKeyMap } from "@_types/main";
import { SVGIcon } from "@_components/common";
import { CommandItemProps } from "./types";

export const CommandItem = ({ command, index, onSelect }: CommandItemProps) => {
  const { osType, theme, autoSave, formatCode, wordWrap, currentCmdkPage } =
    useAppState();

  const settingsProps = useMemo(
    () => ({
      Theme: theme,
      Autosave: autoSave,
      "Format Code": formatCode,
      "Word Wrap": wordWrap,
    }),
    [theme, autoSave, formatCode, wordWrap],
  );

  return (
    <Command.Item
      value={command.Name + index}
      className="rnbw-cmdk-menu-item"
      {...{
        "rnbw-cmdk-menu-item-description": command.Description,
      }}
      onSelect={() => onSelect(command)}
    >
      <div className="justify-stretch padding-s align-center">
        <div className="gap-s align-center">
          {currentCmdkPage === "Jumpstart" &&
          // eslint-disable-next-line no-prototype-builtins
          settingsProps.hasOwnProperty(command.Name) ? (
            <>
              <div className="padding-xs">
                <div className="radius-m icon-xs align-center background-tertiary"></div>
              </div>
              <div className="gap-s align-center">
                <span className="text-m opacity-m">{command.Name}</span>
                <span className="text-s opacity-m">/</span>
                <span className="text-m">
                  {command.Name === "Theme"
                    ? theme
                    : settingsProps[command.Name as keyof typeof settingsProps]
                      ? "On"
                      : "Off"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="padding-xs">
                {typeof command.Icon === "string" && command.Icon !== "" ? (
                  <SVGIcon {...{ class: "icon-xs" }}>
                    raincons/{command.Icon}
                  </SVGIcon>
                ) : (
                  <div className="icon-xs"></div>
                )}
              </div>
              <span className="text-m">{command.Name}</span>
            </>
          )}
        </div>
        <div className="gap-s">
          {command["Keyboard Shortcut"] &&
            (command["Keyboard Shortcut"] as TCmdkKeyMap[])?.map(
              (keyMap, index) => (
                <div className="gap-s" key={index}>
                  {keyMap.cmd && (
                    <span className="text-m">
                      {osType === "Mac" ? "⌘" : "Ctrl"}
                    </span>
                  )}
                  {keyMap.shift && <span className="text-m">⇧</span>}
                  {keyMap.alt && <span className="text-m">Alt</span>}
                  {keyMap.key !== "" && (
                    <span className="text-m">
                      {keyMap.key[0].toUpperCase() +
                        keyMap.key.slice(1) +
                        (index !==
                        (command["Keyboard Shortcut"] as TCmdkKeyMap[]).length -
                          1
                          ? ","
                          : "")}
                    </span>
                  )}
                  {keyMap.click && <span className="text-m">Click</span>}
                </div>
              ),
            )}
        </div>
      </div>
    </Command.Item>
  );
};
