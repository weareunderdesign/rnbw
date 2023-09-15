import { useCallback, useContext, useEffect } from "react";

import { useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import { reloadLocalProject, TFileNodeData } from "@_node/file";

import { TNodeTreeData } from "@_node/types";
import { MainContext, navigatorSelector } from "@_redux/main";
import { saveFileContent } from "../helpers";

export const useSaveCommand = () => {
  const { file } = useSelector(navigatorSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // navigator
    project,
    // file tree view
    ffTree,
    setFFTree,
    ffHandlers,
    // stage view
    setNeedToReloadIFrame,
    // cmdk
    currentCommand,
    // other
    osType,
    // toasts
    addMessage,
  } = useContext(MainContext);

  useEffect(() => {
    switch (currentCommand.action) {
      case "Save":
        onSave();
        break;
      default:
        return;
    }
  }, [currentCommand]);

  const onSave = useCallback(async () => {
    if (!ffTree[RootNodeUid]) return;

    const _ffTree = JSON.parse(JSON.stringify(ffTree)) as TNodeTreeData;

    addRunningActions(["process-save"]);

    const uids = getSubNodeUidsByBfs(RootNodeUid, _ffTree);

    await Promise.all(
      uids.map(async (uid) => {
        if (file.uid === uid) {
          /* only save current file */
          const node = _ffTree[uid];
          const nodeData = node.data as TFileNodeData;

          if (nodeData.changed) {
            try {
              saveFileContent(project, ffHandlers, uid, nodeData);
            } catch (err) {
              addMessage({
                type: "error",
                content: "error occurred while saving",
              });
            }
          }

          const fileData = ffTree[file.uid].data as TFileNodeData;
          if (fileData.ext === ".css" || fileData.ext === ".js") {
            reloadLocalProject(
              ffHandlers[RootNodeUid] as FileSystemDirectoryHandle,
              ffTree,
              osType,
              [file.uid],
            );
            setNeedToReloadIFrame(true);
          }
        }
      }),
    );

    setFFTree(_ffTree);

    removeRunningActions(["process-save"], false);
  }, [ffTree, ffHandlers, reloadLocalProject]);
};
