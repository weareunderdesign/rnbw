import { useCallback, useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { AutoSaveDelay, RootNodeUid } from "@_constants/main";
import { TFileNodeTreeData } from "@_node/file";
import { MainContext } from "@_redux/main";
import { setFileTree } from "@_redux/main/fileTree";
import { setNeedToReloadIframe } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import { saveFileContent } from "../helpers";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { debounce } from "lodash";
import { setLoadingFalse, setLoadingTrue } from "@_redux/main/processor";

export const useSaveCommand = () => {
  const dispatch = useDispatch();
  const { project, fileTree, currentFileUid, currentCommand, fileHandlers } =
    useAppState();
  const { addRunningActions, removeRunningActions } = useContext(MainContext);

  useEffect(() => {
    if (!currentCommand) return;

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
    dispatch(setLoadingTrue());
    const _ffTree = structuredClone(fileTree);
    let file = _ffTree[currentFileUid];
    const fileData = file.data;

    addRunningActions(["processor-save-currentFile"]);
    if (fileData.changed) {
      try {
        await saveFileContent(project, fileHandlers, currentFileUid, fileData);
      } catch (err) {}

      while (file) {
        file.data.changed = false;
        file = _ffTree[file.parentUid!];
      }
    }
    removeRunningActions(["processor-save-currentFile"]);

    dispatch(setFileTree(_ffTree as TFileNodeTreeData));
    fileData.ext !== "html" && dispatch(setNeedToReloadIframe(true));
    dispatch(setLoadingFalse());
  }, [project, fileTree, fileHandlers, currentFileUid]);

  const onSaveProject = useCallback(async () => {}, []);

  const debouncedAutoSave = useCallback(
    debounce(
      () => dispatch(setCurrentCommand({ action: "Save" })),
      AutoSaveDelay,
    ),
    [],
  );

  return { onSaveCurrentFile, onSaveProject, debouncedAutoSave };
};
