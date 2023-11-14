import { useCallback, useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { TFileNodeTreeData } from "@_node/file";
import { MainContext } from "@_redux/main";
import { setFileTree } from "@_redux/main/fileTree";
import { setNeedToReloadIframe } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import { saveFileContent } from "../helpers";

export const useSaveCommand = () => {
  const dispatch = useDispatch();
  const { project, fileTree, currentFileUid, currentCommand } = useAppState();

  const { addRunningActions, removeRunningActions, fileHandlers } =
    useContext(MainContext);

  useEffect(() => {
    switch (currentCommand?.action) {
      case "Save":
        onSaveCurrentFile();
        break;
      case "SaveAll":
        onSaveProject();
      default:
        return;
    }
  }, [currentCommand]);

  const onSaveCurrentFile = useCallback(async () => {
    if (!fileTree[RootNodeUid]) return;

    const _ffTree = structuredClone(fileTree);
    const file = _ffTree[currentFileUid];
    const fileData = file.data;

    addRunningActions(["processor-save-currentFile"]);
    if (fileData.changed) {
      try {
        await saveFileContent(project, fileHandlers, currentFileUid, fileData);
      } catch (err) {}
    }
    removeRunningActions(["processor-save-currentFile"]);

    dispatch(setFileTree(_ffTree as TFileNodeTreeData));
    fileData.ext !== "html" && dispatch(setNeedToReloadIframe(true));
  }, [project, fileTree, fileHandlers, currentFileUid]);

  const onSaveProject = useCallback(async () => {}, []);
};
