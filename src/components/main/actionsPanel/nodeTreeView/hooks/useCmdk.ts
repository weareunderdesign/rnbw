import { useEffect } from "react";

import { isAddNodeAction, isRenameNodeAction } from "@_node/helpers";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionHandlers } from "./useNodeActionHandlers";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();

  const {
    onAddNode,
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onTurnInto,
    onGroup,
    onUngroup,
  } = useNodeActionHandlers();

  useEffect(() => {
    if (!currentCommand) return;

    if (isAddNodeAction(currentCommand.action)) {
      onAddNode(currentCommand.action);
      return;
    }

    if (isRenameNodeAction(currentCommand.action)) {
      onTurnInto(currentCommand.action);
      return;
    }

    if (activePanel !== "node" && activePanel !== "stage") return;

    switch (currentCommand.action) {
      case "Cut":
        onCut();
        break;
      case "Copy":
        onCopy();
        break;
      case "Paste":
        onPaste();
        break;
      case "Span Paste":
        onPaste({
          spanPaste: true,
        });
        break;
      case "Delete":
        onDelete();
        break;
      case "Duplicate":
        onDuplicate();
        break;
      case "Group":
        onGroup();
        break;
      case "Ungroup":
        onUngroup();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
