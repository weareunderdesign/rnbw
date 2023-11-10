import { useContext } from "react";

import { useDispatch, useSelector } from "react-redux";

import { TFileNodeData } from "@_node/file";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  projectSelector,
  setCurrentFileUid,
  updateFileTreeViewState,
} from "@_redux/main/fileTree";
import { setFileAction, TFileAction } from "@_redux/main/fileTree/event";
import { verifyFileHandlerPermission } from "@_services/main";

import { useInvalidNodes, useReloadProject } from "../hooks";
import { moveActions } from "./moveActions";

export const renameNode = async (
  ext: string,
  newName: string,
  nodeData: TFileNodeData,
  parentNode: TNode,
  parentNodeData: TFileNodeData,
  uid: TNodeUid,
) => {
  const dispatch = useDispatch();
  const project = useSelector(projectSelector);

  const { removeRunningActions, fileHandlers } = useContext(MainContext);

  const { cb_reloadProject } = useReloadProject();

  const { removeInvalidNodes, setInvalidNodes } = useInvalidNodes();

  const { moveIDBFF, moveLocalFF } = moveActions(() => {});

  const _orgName =
    ext === "*folder" ? `${nodeData.name}` : `${nodeData.name}${nodeData.ext}`;

  const _newName = ext === "*folder" ? `${newName}` : `${newName}${ext}`;

  const newUid = `${parentNode.uid}/${_newName}`;

  if (project.context === "local") {
    const handler = fileHandlers[uid],
      parentHandler = fileHandlers[parentNode.uid] as FileSystemDirectoryHandle;
    if (
      !(await verifyFileHandlerPermission(handler)) ||
      !(await verifyFileHandlerPermission(parentHandler))
    ) {
      // addMessage(invalidDirOrFile);

      removeRunningActions(["fileTreeView-rename"]);
      return;
    }

    setInvalidNodes(newUid);

    try {
      await moveLocalFF(
        handler,
        parentHandler,
        parentHandler,
        _newName,
        false,
        true,
      );
      removeInvalidNodes(newUid);
    } catch (err) {
      // addMessage(renamingError);

      removeInvalidNodes(newUid);
      removeRunningActions(["fileTreeView-rename"]);
      return;
    }
  } else if (project.context === "idb") {
    setInvalidNodes(newUid);

    try {
      await moveIDBFF(nodeData, parentNodeData, _newName, false, true);
      removeInvalidNodes(newUid);
    } catch (err) {
      // addMessage(renamingError);

      removeInvalidNodes(newUid);
      removeRunningActions(["fileTreeView-rename"]);
      return;
    }
  }

  const action: TFileAction = {
    type: "rename",
    param1: { uid, parentUid: parentNode.uid },
    param2: { orgName: _orgName, newName: _newName },
  };
  dispatch(setFileAction(action));

  // update redux
  dispatch(setCurrentFileUid(newUid));
  dispatch(updateFileTreeViewState({ convertedUids: [[uid, newUid]] }));

  await cb_reloadProject();
  removeRunningActions(["fileTreeView-rename"]);
};
