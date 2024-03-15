import { useCallback, useContext } from "react";

import { getMany } from "idb-keyval";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { isUnsavedProject } from "@_node/file/helpers";
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
  const { fileTree, navigatorDropdownType, showFilePanel } = useAppState();

  const {
    // open project
    importProject,
  } = useContext(MainContext);

  const onWorkspaceClick = useCallback(async () => {
    const sessionInfo = await getMany([
      "recent-project-context",
      "recent-project-name",
      "recent-project-handler",
    ]);
    if (
      sessionInfo[0] &&
      sessionInfo[1] &&
      sessionInfo[2] &&
      navigatorDropdownType !== "workspace"
    ) {
      dispatch(setNavigatorDropdownType("workspace"));
    }
  }, [navigatorDropdownType]);

  const onProjectClick = () => {
    dispatch(setNavigatorDropdownType("project"));
  };

  const onFileClick = () => {
    dispatch(setNavigatorDropdownType("project"));
  };

  const onCloseDropDown = () => {
    dispatch(setNavigatorDropdownType(null));
  };

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

  const onPanelClick = () => {
    dispatch(setActivePanel("file"));
    dispatch(setShowFilePanel(!showFilePanel));
  };

  return {
    onProjectClick,
    onFileClick,
    onCloseDropDown,
    onWorkspaceClick,
    onOpenProject,
    onPanelClick,
  };
};
