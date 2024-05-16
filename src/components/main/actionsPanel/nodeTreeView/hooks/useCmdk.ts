import { useEffect } from "react";

import { isAddNodeAction, isRenameNodeAction } from "@_node/helpers";
import { useAppState } from "@_redux/useAppState";
import { AddNodeActionPrefix, RenameNodeActionPrefix } from "@_constants/main";
import useRnbw from "@_services/useRnbw";
import useTurnInto from "@_actions/useTurnInto.actions";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();

  const rnbw = useRnbw();
  const turnInto = useTurnInto();

  useEffect(() => {
    if (!currentCommand || !rnbw) return;

    if (isAddNodeAction(currentCommand.action)) {
      // onAddNode(currentCommand.action);
      const actionName = currentCommand.action;
      const tagName = actionName.slice(
        AddNodeActionPrefix.length + 2,
        actionName.length - 1,
      );
      rnbw.elements &&
        rnbw.elements.add({
          tagName,
          attributes: "",
        });
      return;
    }

    if (isRenameNodeAction(currentCommand.action)) {
      const actionName = currentCommand.action;
      const tagName = actionName.slice(
        RenameNodeActionPrefix.length + 2,
        actionName.length - 1,
      );
      turnInto.action(tagName);
      return;
    }

    if (activePanel !== "node" && activePanel !== "stage") return;

    switch (currentCommand.action) {
      case "Cut":
        rnbw.elements.cut();
        break;
      case "Copy":
        rnbw.elements.copy();
        break;
      case "Paste":
        rnbw.elements.paste();
        break;
      case "Delete":
        rnbw.elements.remove();
        break;
      case "Duplicate":
        rnbw.elements.duplicate();
        break;
      case "Group":
        rnbw.elements.group();
        break;
      case "Ungroup":
        rnbw.elements.ungroup();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
