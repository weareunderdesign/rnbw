import { useEffect } from "react";

import { AddFileActionPrefix } from "@_constants/main";
import { isAddFileAction } from "@_node/helpers";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionsHandler } from "./useNodeActionsHandler";
import useRnbw from "@_services/useRnbw";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const rnbw = useRnbw();

  const { onAdd, onCut, onCopy, onPaste, onDuplicate } =
    useNodeActionsHandler();

  useEffect(() => {
    if (!currentCommand) return;

    if (isAddFileAction(currentCommand.action)) {
      const type = currentCommand.action.slice(AddFileActionPrefix.length + 1);
      onAdd(type === "folder" ? true : false, type);
      return;
    }

    if (activePanel !== "file") return;

    switch (currentCommand.action) {
      case "Delete":
        // onRemove();
        rnbw.files.remove();
        break;
      case "Cut":
        onCut();
        break;
      case "Copy":
        onCopy();
        break;
      case "Paste":
        onPaste();
        break;
      case "Duplicate":
        onDuplicate();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
