import React, { useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { useAppState } from "@_redux/useAppState";
import { TCmdkKeyMap } from "@_types/main";
import { SVGIcon } from "@_components/common";
import { CommandItemProps } from "./types";
import { KeyboardShortcut } from "./KeyboardShortcut";

export const CommandItem = ({
  command,
  index,
  onSelect,
  onMouseEnter,
}: CommandItemProps) => {
  const { theme, autoSave, wordWrap, currentCmdkPage } = useAppState();

  const settingsProps = useMemo(
    () => ({
      Theme: theme,
      Autosave: autoSave,
      "Code Wrap": wordWrap,
    }),
    [theme, autoSave, wordWrap],
  );

  const isSettingsGroup = useCallback(() => {
    return (
      currentCmdkPage === "Jumpstart" &&
      // eslint-disable-next-line no-prototype-builtins
      settingsProps.hasOwnProperty(command.Name)
    );
  }, [settingsProps, currentCmdkPage, command.Name]);

  return (
    <Command.Item
      value={command.Name + index}
      className="rnbw-cmdk-menu-item"
      rnbw-cmdk-menu-item-description={command.Description}
      onSelect={() => onSelect(command)}
      onMouseEnter={onMouseEnter}
    >
      <div className="justify-stretch padding-s align-center">
        <div className="gap-s align-center">
          <div className="padding-xs">
            {isSettingsGroup() ? (
              <div className="radius-m icon-xs align-center background-tertiary" />
            ) : typeof command.Icon === "string" && command.Icon !== "" ? (
              <SVGIcon {...{ class: "icon-xs" }}>
                raincons/{command.Icon}
              </SVGIcon>
            ) : (
              <div className="icon-xs"></div>
            )}
          </div>

          <span className="text-m">{command.Name}</span>
          {isSettingsGroup() && (
            <>
              <span className="text-s opacity-m">/</span>
              <span className="text-m">
                {command.Name === "Theme"
                  ? theme
                  : settingsProps[command.Name as keyof typeof settingsProps]
                    ? "On"
                    : "Off"}
              </span>
            </>
          )}
        </div>

        <div className="gap-s">
          {(command["Keyboard Shortcut"] as TCmdkKeyMap[])?.map(
            (keyMap, index, shortcuts) => (
              <KeyboardShortcut
                keyMap={keyMap}
                key={index}
                index={index}
                shortcuts={shortcuts}
              />
            ),
          )}
        </div>
      </div>
    </Command.Item>
  );
};
