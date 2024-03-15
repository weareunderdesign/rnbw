import { TNodeUid } from "@_node/index";

export type TProcessorReducerState = {
  doingAction: boolean;

  navigatorDropdownType: TNavigatorDropdownType;
  favicon: string;

  activePanel: TPanelContext;
  clipboardData: TClipboardData | null;

  showActionsPanel: boolean;
  showCodeView: boolean;
  showFilePanel: boolean;

  autoSave: boolean;
  formatCode: boolean;

  didUndo: boolean;
  didRedo: boolean;
  loading: number;
};

export type TNavigatorDropdownType = "workspace" | "project" | null;

export type TPanelContext =
  | "file"
  | "node"
  | "settings"
  | "styles"
  | "stage"
  | "code"
  | "cmdk"
  | "processor"
  | "hms"
  | "none";

export type TClipboardData = {
  panel: TPanelContext;
  type: "cut" | "copy" | null;
  uids: TNodeUid[];
};
