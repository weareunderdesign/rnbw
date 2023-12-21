import { useCallback, useEffect } from "react";

import { AddFileActionPrefix } from "@_constants/main";
import { isAddFileAction } from "@_node/helpers";
import { useAppState } from "@_redux/useAppState";

import { useNodeActionsHandler } from "./useNodeActionsHandler";

interface IUseCmdk {
  invalidNodes: {
    [uid: string]: true;
  };
  addInvalidNodes: (...uids: string[]) => void;
  removeInvalidNodes: (...uids: string[]) => void;
  temporaryNodes: {
    [uid: string]: true;
  };
  addTemporaryNodes: (...uids: string[]) => void;
  removeTemporaryNodes: (...uids: string[]) => void;
  openFileUid: React.MutableRefObject<string>;
}
export const useCmdk = ({
  invalidNodes,
  addInvalidNodes,
  removeInvalidNodes,
  temporaryNodes,
  addTemporaryNodes,
  removeTemporaryNodes,
  openFileUid,
}: IUseCmdk) => {
  const { activePanel, currentCommand } = useAppState();

  const { onAdd, onRemove } = useNodeActionsHandler({
    invalidNodes,
    addInvalidNodes,
    removeInvalidNodes,
    temporaryNodes,
    addTemporaryNodes,
    removeTemporaryNodes,
    openFileUid,
  });

  const onAddNode = useCallback(
    (actionName: string) => {
      const type = actionName.slice(AddFileActionPrefix.length + 1);
      onAdd(type === "folder" ? true : false, type);
    },
    [onAdd],
  );

  useEffect(() => {
    if (!currentCommand) return;

    if (isAddFileAction(currentCommand.action)) {
      onAddNode(currentCommand.action);
      return;
    }

    if (activePanel !== "file") return;

    switch (currentCommand.action) {
      case "Delete":
        onRemove();
        break;
      /* case "Cut":
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
        break; */
      default:
        break;
    }
  }, [currentCommand]);
};
