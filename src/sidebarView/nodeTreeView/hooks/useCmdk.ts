import { useEffect, useRef } from "react";

import { isAddNodeAction, isRenameNodeAction } from "@_api/helpers";
import { useAppState } from "@_redux/useAppState";
import { AddNodeActionPrefix, RenameNodeActionPrefix } from "@src/rnbwTSX";
import useRnbw from "@_services/useRnbw";
import { useTurnInto, useFormatCode } from "@_actions/index";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();

  const activePanelRef = useRef(activePanel);
  const rnbw = useRnbw();
  const formatCode = useFormatCode();
  const turnInto = useTurnInto();

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    if (!currentCommand || !rnbw.elements) return;

    if (isAddNodeAction(currentCommand.action)) {
      // onAddNode(currentCommand.action);
      const actionName = currentCommand.action;
      const tagName = actionName.slice(
        AddNodeActionPrefix.length + 2,
        actionName.length - 1,
      );

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

    if (activePanelRef.current !== "node" && activePanelRef.current !== "stage")
      return;

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
      case "Format":
        formatCode.action();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
