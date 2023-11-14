import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { AddFileActionPrefix } from "@_constants/main";
import {
  currentFileUidSelector,
  fileTreeSelector,
  fileTreeViewStateSelector,
} from "@_redux/main/fileTree";
import { nodeTreeSelector } from "@_redux/main/nodeTree";
import {
  clipboardDataSelector,
  setClipboardData,
} from "@_redux/main/processor";
import { TFileNodeType } from "@_types/main";

import { useInvalidNodes } from "./useInvalidNodes";
import { useNodeActionsHandler } from "./useNodeActionsHandler";

export const useCmdk = (openFileUid: React.MutableRefObject<string>) => {
  const dispatch = useDispatch();

  const currentFileUid = useSelector(currentFileUidSelector);
  const { focusedItem, selectedItems } = useSelector(fileTreeViewStateSelector);

  const clipboardData = useSelector(clipboardDataSelector);
  const fileTree = useSelector(fileTreeSelector);
  const nodeTree = useSelector(nodeTreeSelector);

  const { createTmpFFNode, cb_deleteNode, cb_moveNode, cb_duplicateNode } =
    useNodeActionsHandler(openFileUid);

  const { invalidNodes } = useInvalidNodes();

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

  const onAddNode = useCallback(
    (actionName: string) => {
      const nodeType = actionName.slice(AddFileActionPrefix.length + 1);
      createTmpFFNode(
        nodeType === "folder" ? "*folder" : (nodeType as TFileNodeType),
      );
    },
    [createTmpFFNode],
  );

  return {
    onDelete,
    onCut,
    onCopy,
    onPaste,
    onDuplicate,
    onAddNode,
  };
};
