import { useCallback, useContext, useEffect } from "react";
import { RootNodeUid } from "@src/rnbwTSX";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import useRnbw from "@_services/useRnbw";

export const useWorkspaceInit = () => {
  const { project, fileTree, initialFileUidToOpen, fileHandlers } =
    useAppState();
  const { reloadCurrentProject } = useContext(MainContext);
  const rnbw = useRnbw();

  const createDefaultFile = useCallback(async () => {
    if (project?.context === "local") {
      const noInitialFileToOpen = initialFileUidToOpen === "";
      const rootFileHandlerExists = fileHandlers[RootNodeUid];
      const noHtmlFileExistsInRoot = !Object.values(fileTree).some(
        (node) => node?.data?.ext === "html" && node.parentUid === RootNodeUid,
      );
      if (noInitialFileToOpen && noHtmlFileExistsInRoot) {
        if (rootFileHandlerExists) {
          //create a default file index.html in the root directory
          rnbw.files.createFile({ entityName: "index", extension: "html" });
          reloadCurrentProject();
        }
      }
    }
  }, [project, fileTree, fileHandlers, initialFileUidToOpen]);

  useEffect(() => {
    createDefaultFile();
  }, [createDefaultFile]);
};
