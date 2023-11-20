import { useCallback, useContext, useEffect } from "react";

import { AddNodeActionPrefix } from "@_constants/main";
import { MainContext } from "@_redux/main";

import { useNodeActionsHandlers } from "./useNodeActionsHandlers";
import { useAppState } from "@_redux/useAppState";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const {} = useContext(MainContext);

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
  } = useNodeActionsHandlers();

  const isAddNodeAction = useCallback((actionName: string): boolean => {
    return actionName.startsWith(AddNodeActionPrefix) ? true : false;
  }, []);

  useEffect(() => {
    if (!currentCommand) return;

    if (isAddNodeAction(currentCommand.action)) {
      onAddNode(currentCommand.action);
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
      case "Delete":
        onDelete();
        break;
      case "Duplicate":
        onDuplicate();
        break;
      case "Turn into":
        onTurnInto();
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
