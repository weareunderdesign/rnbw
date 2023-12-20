import { useCallback, useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { AddFileActionPrefix } from "@_constants/main";
import { setClipboardData } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { TFileNodeType } from "@_types/main";

import { useNodeActionsHandler } from "./useNodeActionsHandler";
import { isAddFileAction } from "@_node/helpers";
import { TFileApiPayload, doFileActions } from "@_node/index";
import { MainContext } from "@_redux/main";
import { LogAllow } from "@_constants/global";

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
  const dispatch = useDispatch();
  const {
    activePanel,
    currentFileUid,
    fFocusedItem: focusedItem,
    fSelectedItems: selectedItems,
    clipboardData,
    fileTree,
    nodeTree,
    currentCommand,
  } = useAppState();

  const { fileHandlers, reloadCurrentProject, currentProjectFileHandle } =
    useContext(MainContext);
  const { createTmpFFNode } = useNodeActionsHandler({
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
      const nodeType = actionName.slice(AddFileActionPrefix.length + 1);
      createTmpFFNode(
        nodeType === "folder" ? "*folder" : (nodeType as TFileNodeType),
      );
    },
    [createTmpFFNode],
  );

  const onCopy = useCallback(() => {
    const params: TFileApiPayload = {
      projectContext: "local",
      action: "copy",
      uids: selectedItems,
      fileTree,
      fileHandlers,
      dispatch,
      currentFileUid,
      nodeTree,
    };
    doFileActions(params);
  }, [selectedItems, fileTree[currentFileUid], nodeTree]);

  const onPaste = useCallback(() => {
    if (clipboardData?.panel !== "file") return;
    const params: TFileApiPayload = {
      projectContext: "local",
      fileHandlers,
      uids: selectedItems,
      clipboardData,
      fileTree,
      action: "move",
      targetNode: fileTree[focusedItem],
    };
    // validate
    if (invalidNodes[focusedItem]) return;
    const uids = clipboardData.uids.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;
    doFileActions(
      params,
      () => {
        LogAllow && console.error("error while removing file system");
      },
      (allDone: boolean) => {
        reloadCurrentProject(fileTree, currentProjectFileHandle);
        LogAllow &&
          console.log(
            allDone ? "all is successfully removed" : "some is not removed",
          );
      },
    );
  }, [clipboardData, selectedItems, fileTree[currentFileUid], nodeTree]);

  const onDuplicate = useCallback(() => {
    if (clipboardData?.panel !== "file") return;
    onCopy();
    onPaste();
  }, []);

  const onDelete = useCallback(() => {
    const params: TFileApiPayload = {
      projectContext: "local",
      action: "remove",
      uids: selectedItems,
      fileTree,
      fileHandlers,
    };
    doFileActions(
      params,
      () => {
        LogAllow && console.error("error while removing file system");
      },
      (allDone: boolean) => {
        reloadCurrentProject(fileTree, currentProjectFileHandle);
        LogAllow &&
          console.log(
            allDone ? "all is successfully removed" : "some is not removed",
          );
      },
    );
  }, [selectedItems, fileTree[currentFileUid], nodeTree]);

  const onCut = useCallback(() => {
    if (clipboardData?.panel !== "file") return;
    onCopy();
    onDelete();
  }, []);

  useEffect(() => {
    if (!currentCommand) return;
    if (isAddFileAction(currentCommand.action)) {
      onAddNode(currentCommand.action);
      return;
    }
    if (activePanel !== "file") return;

    switch (currentCommand.action) {
      case "Delete":
        onDelete();
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
