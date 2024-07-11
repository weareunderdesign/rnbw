import { useCallback, useContext } from "react";

import { get } from "idb-keyval";
import { useDispatch } from "react-redux";

import { LogAllow } from "@src/rnbwTSX";
import { isUnsavedProject } from "@_api/file/helpers";
import { MainContext } from "@_redux/main";
import { TProject } from "@_redux/main/fileTree";
import {
  setActivePanel,
  setNavigatorDropdownType,
  setShowFilePanel,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const useNavigatorPanelHandlers = () => {
  const dispatch = useDispatch();
  const { fileTree, navigatorDropdownType, showFilePanel, activePanel } =
    useAppState();

  const {
    // open project
    importProject,
  } = useContext(MainContext);

  const onWorkspaceClick = useCallback(async () => {
    const sessionInfo = await get("recent-project");
    if (sessionInfo && navigatorDropdownType !== "workspace") {
      dispatch(setNavigatorDropdownType("workspace"));
    }
  }, [navigatorDropdownType]);

  const onProjectClick = useCallback(() => {
    navigatorDropdownType !== "project" &&
      dispatch(setNavigatorDropdownType("project"));
  }, [navigatorDropdownType]);

  const onFileClick = useCallback(() => {
    navigatorDropdownType !== "project" &&
      dispatch(setNavigatorDropdownType("project"));
  }, [navigatorDropdownType]);

  const onCloseDropDown = useCallback(() => {
    navigatorDropdownType && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  const onOpenProject = useCallback(
    (project: TProject) => {
      LogAllow && console.log("open project", { project });
      // confirm files' changes
      if (fileTree && isUnsavedProject(fileTree)) {
        const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
        if (!window.confirm(message)) {
          return;
        }
      }
      importProject(project.context, project.handler);
    },
    [fileTree],
  );

  const onPanelClick = useCallback(() => {
    if (activePanel !== "file") dispatch(setActivePanel("file"));
    dispatch(setShowFilePanel(!showFilePanel));
  }, [showFilePanel, activePanel]);

  return {
    onProjectClick,
    onFileClick,
    onCloseDropDown,
    onWorkspaceClick,
    onOpenProject,
    onPanelClick,
  };
};
