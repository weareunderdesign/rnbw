import { useCallback, useContext } from "react";
import { getMany } from "idb-keyval";
import { MainContext } from "@_redux/main";
import { TFileNodeData } from "@_node/file";
import { TProject } from "@_types/main";

export const useNavigatorPanelHandlers = () => {
  const {
    // navigator
    navigatorDropDownType,
    setNavigatorDropDownType,
    // node actions
    setActivePanel,
    // file tree view
    ffTree,
    // open project
    loadProject,
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
      navigatorDropDownType !== "workspace"
    ) {
      setNavigatorDropDownType("workspace");
    }
  }, [navigatorDropDownType]);

  const onProjectClick = useCallback(() => {
    setNavigatorDropDownType("project");
  }, []);

  const onFileClick = useCallback(() => {
    setNavigatorDropDownType("project");
  }, []);

  const onCloseDropDown = useCallback(() => {
    setNavigatorDropDownType(null);
  }, []);

  const onOpenProject = useCallback(
    (project: TProject) => {
      console.log("open project", { project });
      if (ffTree) {
        // confirm files' changes
        let hasChangedFile = false;
        for (let x in ffTree) {
          const _file = ffTree[x];
          const _fileData = _file.data as TFileNodeData;
          if (_file && _fileData.changed) {
            hasChangedFile = true;
          }
        }
        if (hasChangedFile) {
          const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
          if (!window.confirm(message)) {
            return;
          }
        }
      }
      loadProject(project.context, project.handler, false);
    },
    [ffTree],
  );

  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel("file");
  }, []);

  return {
    onProjectClick,
    onFileClick,
    onCloseDropDown,
    onWorkspaceClick,
    onOpenProject,
    onPanelClick,
  };
};
