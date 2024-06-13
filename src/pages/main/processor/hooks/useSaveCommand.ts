import { useCallback, useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { AutoSaveDelay, RootNodeUid } from "@_constants/main";
import { TFileNodeTreeData } from "@_node/file";

import { setFileTree } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { saveFileContent } from "../helpers";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { addRunningAction, removeRunningAction } from "@_redux/main/processor";
import { debounce } from "@_pages/main/helper";
import { toast } from "react-toastify";
import { MainContext } from "@_redux/main";

export const useSaveCommand = () => {
  const dispatch = useDispatch();
  const { project, fileTree, currentFileUid, currentCommand, fileHandlers } =
    useAppState();
  const { iframeRefRef } = useContext(MainContext);

  const refreshStageCSS = () => {
    const fileType = fileTree[currentFileUid]?.data?.ext;
    if (fileType !== "css") return;
    const iframe = iframeRefRef.current;
    const links = iframe?.contentDocument?.getElementsByTagName("link");
    if (!links) return;
    for (let i = 0; i < links.length; i++) {
      if (links[i].getAttribute("rel") == "stylesheet") {
        const href = links[i]?.getAttribute("href")?.split("?")[0];

        const newHref = href + "?version=" + new Date().getMilliseconds();

        links[i].setAttribute("href", newHref);
      }
    }
  };
  useEffect(() => {
    if (!currentCommand) return;

    switch (currentCommand?.action) {
      case "Save":
        onSaveCurrentFile();
        break;
      case "SaveAll":
        onSaveProject();
        break;
      default:
        return;
    }
  }, [currentCommand]);

  const onSaveCurrentFile = useCallback(async () => {
    if (!fileTree[RootNodeUid]) return;
    const _ffTree = structuredClone(fileTree);
    let file = _ffTree[currentFileUid];
    const fileData = file?.data;

    dispatch(addRunningAction());
    if (fileData?.changed) {
      try {
        await saveFileContent(project, fileHandlers, currentFileUid, fileData);
      } catch (err) {
        toast.error("An error occurred while saving the file");
        console.error(err);
      }

      while (file) {
        file.data.changed = false;
        file = _ffTree[file.parentUid!];
      }
    }
    dispatch(removeRunningAction());
    dispatch(setFileTree(_ffTree as TFileNodeTreeData));
    refreshStageCSS();
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
