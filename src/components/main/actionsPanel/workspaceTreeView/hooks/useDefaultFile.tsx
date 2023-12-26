import { RootNodeUid } from "@_constants/main";
import { FileActions } from "@_node/apis";
import { MainContext } from "@_redux/main";
import { setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
// import { createDefaultFile } from "../helpers/createDefaultFile";

export const useDefaultFileCreate = () => {
  const dispatch = useDispatch();
  const { project, fileTree } = useAppState();
  const { fileHandlers, triggerCurrentProjectReload } = useContext(MainContext);

  useEffect(() => {
    if (
      fileTree[RootNodeUid]?.children?.length === 0 &&
      fileHandlers[RootNodeUid]
    ) {
      console.log("HI !!!!!!!!!!");

      // createDefaultFile(fileHandlers);
      (async () =>
        await FileActions.create({
          projectContext: project.context,
          fileTree,
          fileHandlers,
          parentUid: RootNodeUid,
          name: "index.html",
          kind: "file",
        }))();
      // reload the current project
      triggerCurrentProjectReload();
      // reloadCurrentProject();
      // dispatch(setShowActionsPanel(true));
    }
  }, [fileTree[RootNodeUid]?.children, fileHandlers[RootNodeUid]]);
};
