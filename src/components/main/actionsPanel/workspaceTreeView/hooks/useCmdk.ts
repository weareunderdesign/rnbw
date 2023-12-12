import { useCallback, useEffect } from "react";

import { useDispatch } from "react-redux";

import { AddFileActionPrefix } from "@_constants/main";
import { setClipboardData } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { TFileNodeType } from "@_types/main";

import { useInvalidNodes } from "./useInvalidNodes";
import { useNodeActionsHandler } from "./useNodeActionsHandler";
import { isAddFileAction } from "@_node/helpers";

export const useCmdk = (openFileUid: React.MutableRefObject<string>) => {
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

  const { createTmpFFNode, cb_deleteNode, cb_moveNode, cb_duplicateNode } =
    useNodeActionsHandler(openFileUid);

  const { invalidNodes } = useInvalidNodes();

  const onAddNode = useCallback(
    (actionName: string) => {
      const nodeType = actionName.slice(AddFileActionPrefix.length + 1);
      createTmpFFNode(
        nodeType === "folder" ? "*folder" : (nodeType as TFileNodeType),
      );
    },
    [createTmpFFNode],
  );
  const onDelete = useCallback(() => {
    cb_deleteNode();
  }, [cb_deleteNode]);

  const onCut = useCallback(() => {
    dispatch(
      setClipboardData({
        panel: "file",
        type: "cut",
        uids: selectedItems,
        fileType: fileTree[currentFileUid].data.type,
        data: [],
        fileUid: currentFileUid,
        prevNodeTree: nodeTree,
      }),
    );
  }, [selectedItems, fileTree[currentFileUid], nodeTree]);

  const onCopy = useCallback(() => {
    setClipboardData({
      panel: "file",
      type: "copy",
      uids: selectedItems,
      fileType: fileTree[currentFileUid].data.type,
      data: [],
      fileUid: currentFileUid,
      prevNodeTree: nodeTree,
    });
  }, [selectedItems, fileTree[currentFileUid], nodeTree]);

  const onPaste = useCallback(() => {
    if (clipboardData?.panel !== "file") return;

    // validate
    if (invalidNodes[focusedItem]) return;
    const uids = clipboardData.uids.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;

    if (clipboardData.type === "cut") {
      setClipboardData({
        panel: "file",
        type: "cut",
        uids: [],
        fileType: "html",
        data: [],
        fileUid: "",
        prevNodeTree: {},
      });
      cb_moveNode(uids, focusedItem);
    } else if (clipboardData.type === "copy") {
      cb_moveNode(uids, focusedItem, true);
    }
  }, [clipboardData, invalidNodes, focusedItem, cb_moveNode]);

  const onDuplicate = useCallback(() => {
    cb_duplicateNode();
  }, [cb_duplicateNode]);

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

  return {
    onAddNode,
    onDelete,
    onCut,
    onCopy,
    onPaste,
    onDuplicate,
  };
};
