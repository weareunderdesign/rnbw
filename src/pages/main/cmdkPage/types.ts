import { TCmdkKeyMap, TCmdkReference } from "@_types/main";

export type CommandItemProps = {
  command: TCmdkReference;
  index: number;
  onSelect: (command: TCmdkReference) => Promise<void>;
};
export type TCmdkPage = "Jumpstart" | "Actions" | "Add" | "Turn into";

export type KeyboardShortcutProps = {
  keyMap: TCmdkKeyMap;
  index: number;
  shortcuts: TCmdkKeyMap[];
};
