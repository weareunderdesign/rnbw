import { TCmdkReference } from "@_types/main";

export type CommandItemProps = {
  command: TCmdkReference;
  index: number;
  onSelect: (command: TCmdkReference) => Promise<void>;
};
