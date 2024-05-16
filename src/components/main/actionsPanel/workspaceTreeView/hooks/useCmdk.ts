import { useEffect } from "react";

import { AddFileActionPrefix } from "@_constants/main";
import { isAddFileAction } from "@_node/helpers";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionsHandler } from "./useNodeActionsHandler";
import useRnbw from "@_services/useRnbw";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const rnbw = useRnbw();

  const { onAdd } = useNodeActionsHandler();

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
        rnbw.files.remove();
        break;
      case "Cut":
        rnbw.files.cutFiles();
        break;
      case "Copy":
        rnbw.files.copyFiles();
        break;
      case "Paste":
        rnbw.files.paste();
        break;
      case "Duplicate":
        rnbw.files.copyFiles();
        rnbw.files.paste();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
