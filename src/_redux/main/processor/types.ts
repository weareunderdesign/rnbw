import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";

export type TProcessorReducerState = {
  navigatorDropdownType: TNavigatorDropdownType;
  favicon: string;

  activePanel: TPanelContext;
  clipboardData: TClipboardData;

  showActionsPanel: boolean;
  showCodeView: boolean;

  didUndo: boolean;
  didRedo: boolean;

  updateOptions: TUpdateOptions;
};

export type TNavigatorDropdownType = "workspace" | "project" | null;

export type TPanelContext =
  | "file"
  | "node"
  | "settings"
  | "stage"
  | "code"
  | "cmdk"
  | "none";
export type TClipboardData = {
  panel: TPanelContext;
  type: "cut" | "copy" | null;
  uids: TNodeUid[];
  fileType: "html" | "unknown";
  data: TNode[];
  fileUid: TNodeUid;
  prevNodeTree: TNodeTreeData;
} | null;

export type TUpdateOptions = {
  parse: boolean | null;
  from:
    | "file"
    | "node"
    | "settings"
    | "styles"
    | "stage"
    | "code"
    | "processor"
    | "hms"
    | null;
  isRedoUndo?: boolean;
} | null;
