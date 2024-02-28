import { RootNodeUid } from "@_constants/main";
import { FileActions } from "@_node/apis";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { useCallback, useContext, useEffect } from "react";

export const useDefaultFileCreate = () => {
  const { project, fileTree, initialFileUidToOpen, fileHandlers } = useAppState();
  const { triggerCurrentProjectReload } = useContext(MainContext);

  const createDefaultFile = useCallback(async () => {
    await FileActions.create({
      projectContext: project.context,
      fileTree,
      fileHandlers,
      parentUid: RootNodeUid,
      name: "index.html",
      kind: "file",
    });
  }, [project.context, fileTree, fileHandlers, RootNodeUid]);

  useEffect(() => {
    if (
      initialFileUidToOpen === "" &&
      fileHandlers[RootNodeUid] &&
      !Object.values(fileTree).some(
        (node) => node?.data?.ext === "html" && node.parentUid === RootNodeUid,
      )
    ) {
      createDefaultFile();
      triggerCurrentProjectReload();
    }
  }, [
    fileTree[RootNodeUid]?.children,
    fileHandlers[RootNodeUid],
    initialFileUidToOpen,
  ]);
};
