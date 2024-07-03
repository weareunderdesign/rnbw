import { TOsType } from "@_redux/global";

export const SystemDirectories: {
  [osType in TOsType]: { [name: string]: true };
} = {
  Windows: {
    "$RECYCLE.BIN": true,
    "System Volume Information": true,
    node_modules: true,
  },
  Mac: {
    node_modules: true,
  },
  Linux: {
    node_modules: true,
  },
};
