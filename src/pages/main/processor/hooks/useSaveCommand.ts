import { useCallback, useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { AutoSaveDelay, RootNodeUid } from "@_constants/main";
import { TFileNodeTreeData } from "@_node/file";
import { MainContext } from "@_redux/main";
import { setFileTree } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { saveFileContent } from "../helpers";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { addRunningAction, removeRunningAction } from "@_redux/main/processor";
import { debounce } from "@_pages/main/helper";

export const useSaveCommand = () => {
  const dispatch = useDispatch();
  const { project, fileTree, currentFileUid, currentCommand, fileHandlers } =
    useAppState();
  const { monacoEditorRef } = useContext(MainContext);

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
        const codeViewInstance = monacoEditorRef.current;
        const codeViewInstanceModel = codeViewInstance?.getModel();
        if (codeViewInstanceModel) {
          const code = codeViewInstanceModel.getValue();

          //get the current cursor position
          const cursorPosition = codeViewInstance?.getPosition();
          codeViewInstanceModel.setValue(code);
          codeViewInstance?.setPosition(cursorPosition!);
        }
        await saveFileContent(project, fileHandlers, currentFileUid, fileData);
      } catch (err) {
        console.error(err);
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
