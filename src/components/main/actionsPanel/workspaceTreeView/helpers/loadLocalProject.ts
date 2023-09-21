import { LogAllow, RootNodeUid } from "@_constants/main";
import { TFileHandlerCollection, reloadLocalProject } from "@_node/file";
import { TNodeTreeData } from "@_node/types";
import { TOsType } from "@_types/global";

export const loadLocalProject = async (
  ffTree: TNodeTreeData,
  ffHandlers: TFileHandlerCollection,
  osType: TOsType,
) => {
  try {
    const { handlerObj, deletedUids } = await reloadLocalProject(
      ffHandlers[RootNodeUid] as FileSystemDirectoryHandle,
      ffTree,
      osType,
    );
    return { handlerObj, deletedUids };
  } catch (err) {
    LogAllow && console.log("failed to reload local project");
    return { handlerObj: {}, deletedUids: [] };
  }
};
