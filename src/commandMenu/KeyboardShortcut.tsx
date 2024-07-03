import React from "react";
import { useAppState } from "@_redux/useAppState";
import { KeyboardShortcutProps } from "./types";

export const KeyboardShortcut = ({
  keyMap,
  index,
  shortcuts,
}: KeyboardShortcutProps) => {
  const { osType } = useAppState();

  return (
    <div className="gap-s">
      {keyMap.cmd && (
        <span className="text-m">{osType === "Mac" ? "⌘" : "Ctrl"}</span>
      )}
      {keyMap.shift && <span className="text-m">⇧</span>}
      {keyMap.alt && (
        <span className="text-m">{osType === "Mac" ? "⌥" : "Alt"}</span>
      )}
      {keyMap.key !== "" && (
        <span className="text-m">
          {keyMap.key[0].toUpperCase() +
            keyMap.key.slice(1) +
            (index !== shortcuts.length - 1 ? "," : "")}
        </span>
      )}
      {keyMap.click && <span className="text-m">Click</span>}
    </div>
  );
};
