import { TNodeUid } from "@_api/types";

export type TCodeViewReducerState = {
  editingNodeUid: TNodeUid | null;
  codeViewTabSize: number;
  codeErrors: boolean;
};
