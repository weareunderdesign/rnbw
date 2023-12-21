import { RootNodeUid } from "@_constants/main";
import { MainContext } from "@_redux/main";
import { setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createDefaultFile } from "../helpers/createDefaultFile";

export const useDefaultFileCreate = () => {
  const { fileTree } = useAppState();
  const { fileHandlers, reloadCurrentProject, currentProjectFileHandle } =
    useContext(MainContext);

  const dispatch = useDispatch();

  useEffect(() => {
    if (
      fileTree[RootNodeUid]?.children?.length === 0 &&
      fileHandlers[RootNodeUid]
    ) {
      createDefaultFile(fileHandlers);
      reloadCurrentProject(fileTree, currentProjectFileHandle);
      dispatch(setShowActionsPanel(true));
    }
  }, [fileTree[RootNodeUid]?.children, fileHandlers[RootNodeUid]]);
};
