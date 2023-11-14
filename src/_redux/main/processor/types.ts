import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";

export type TProcessorReducerState = {
  navigatorDropdownType: TNavigatorDropdownType;
  favicon: string;

  activePanel: TPanelContext;
  clipboardData: TClipboardData | null;

  showActionsPanel: boolean;
  showCodeView: boolean;

  didUndo: boolean;
  didRedo: boolean;
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
  fileType: "html" | "unknown";
  data: TNode[];
  fileUid: TNodeUid;
  prevNodeTree: TNodeTreeData;
};
