import { useCallback, useContext, useEffect, useRef } from "react";

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
  const isSaving = useRef(false);

  const refreshStageCSS = () => {
    const fileType = fileTree[currentFileUid]?.data?.ext;
    if (fileType !== "css") return;
    const iframe = iframeRefRef.current;
    const links = iframe?.contentDocument?.getElementsByTagName("link");
    if (!links) return;
    for (let i = 0; i < links.length; i++) {
      if (links[i].getAttribute("rel") == "stylesheet") {
        const href = links[i]?.getAttribute("href")?.split("?")[0];
        //if href contains online link, don't refresh
        if (!href) return;
        if (href.includes("http")) return;

        const newHref = href + "?version=" + new Date().getMilliseconds();

        links[i].setAttribute("href", newHref);
      }
    }
  };

  useEffect(() => {
    if (!currentCommand) return;

    const action = currentCommand.action;
    switch (action) {
      case "Save":
        if (!isSaving.current) onSaveCurrentFile();
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
        isSaving.current = true;
        await saveFileContent(project, fileHandlers, currentFileUid, fileData);
        if (fileData?.ext === "css") {
          refreshStageCSS();
        } else if (fileData?.ext === "js") {
          //check if the iframe has imported the current file
          iframeRefRef.current?.contentWindow?.location.reload();
        }
      } catch (err) {
        toast.error("An error occurred while saving the file");
        console.error(err);
      } finally {
        isSaving.current = false;
      }

      while (file) {
        file.data.changed = false;
        file = _ffTree[file.parentUid!];
      }
    }
    dispatch(removeRunningAction());
    dispatch(setFileTree(_ffTree as TFileNodeTreeData));
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
