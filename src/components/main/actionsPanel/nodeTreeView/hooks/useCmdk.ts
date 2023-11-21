import { useContext, useEffect } from "react";

import { useSelector } from "react-redux";

import { AddNodeActionPrefix } from "@_constants/main";
import { themeSelector } from "@_redux/global";
import { MainContext } from "@_redux/main";
import { currentCommandSelector } from "@_redux/main/cmdk";
import { activePanelSelector } from "@_redux/main/processor";

import { useNodeActionsHandlers } from "./useNodeActionsHendlers";

export const useCmdk = () => {
  const activePanel = useSelector(activePanelSelector);
  const currentCommand = useSelector(currentCommandSelector);
  const theme = useSelector(themeSelector);

  const {} = useContext(MainContext);

  const {
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onTurnInto,
    onGroup,
    onUngroup,
    onAddNode,
    onFormatting,
  } = useNodeActionsHandlers();

  const isAddNodeAction = (actionName: string): boolean => {
    return actionName.startsWith(AddNodeActionPrefix) ? true : false;
  };

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
      case "Formatting":
        onFormatting();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
