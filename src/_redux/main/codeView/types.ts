import { TNodeUid } from "@_node/types";

export type TCodeViewReducerState = {
  editingNodeUid: TNodeUid | null;
  codeViewTabSize: number;
  codeErrors: boolean;
};
