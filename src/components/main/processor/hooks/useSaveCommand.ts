import { useCallback, useContext, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { getSubNodeUidsByBfs } from "@_node/apis";
import {
  TFileNodeData,
  TFileNodeTreeData,
  loadLocalProject,
} from "@_node/file";
import { TNodeTreeData } from "@_node/types";
import { osTypeSelector } from "@_redux/global";
import { MainContext } from "@_redux/main";
import { currentCommandSelector } from "@_redux/main/cmdk";
import {
  currentFileUidSelector,
  fileTreeSelector,
  projectSelector,
  setFileTree,
} from "@_redux/main/fileTree";
import { setNeedToReloadIframe } from "@_redux/main/stageView";

import { saveFileContent } from "../helpers";

export const useSaveCommand = () => {
  const dispatch = useDispatch();

  const project = useSelector(projectSelector);
  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);

  const currentCommand = useSelector(currentCommandSelector);
  const osType = useSelector(osTypeSelector);

  const {
    addRunningActions,
    removeRunningActions,

    fileHandlers,
  } = useContext(MainContext);

  useEffect(() => {
    switch (currentCommand?.action) {
      case "Save":
        onSave();
        break;
      default:
        return;
    }
  }, [currentCommand]);

  const onSave = useCallback(async () => {
    if (!fileTree[RootNodeUid]) return;

    const _ffTree = JSON.parse(JSON.stringify(fileTree)) as TNodeTreeData;

    addRunningActions(["process-save"]);

    const uids = getSubNodeUidsByBfs(RootNodeUid, _ffTree);

    await Promise.all(
      uids.map(async (uid) => {
        if (currentFileUid === uid) {
          /* only save current file */
          const node = _ffTree[uid];
          const nodeData = node.data as TFileNodeData;

          if (nodeData.changed) {
            try {
              saveFileContent(project, fileHandlers, uid, nodeData);
            } catch (err) {}
          }

          const fileData = fileTree[currentFileUid].data as TFileNodeData;
          if (fileData.ext === ".css" || fileData.ext === ".js") {
            loadLocalProject(
              fileHandlers[RootNodeUid] as FileSystemDirectoryHandle,
              osType,
              // fileTree,
              // [currentFileUid],
            );
            dispatch(setNeedToReloadIframe(true));
          }
        }
      }),
    );

    dispatch(setFileTree(_ffTree as TFileNodeTreeData));

    removeRunningActions(["process-save"], false);
  }, [fileTree, fileHandlers, loadLocalProject]);
};
