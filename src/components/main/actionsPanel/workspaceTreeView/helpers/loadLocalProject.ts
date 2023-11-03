import { LogAllow } from "@_constants/global";
import { RootNodeUid } from "@_constants/main";
import { reloadLocalProject, TFileHandlerCollection } from "@_node/file";
import { TNodeTreeData } from "@_node/types";
import { TOsType } from "@_redux/global";

export const loadLocalProject = async (
  ffTree: TNodeTreeData,
  fileHandlers: TFileHandlerCollection,
  osType: TOsType,
) => {
  return { handlerObj: {}, deletedUids: [] };
  try {
    const { handlerObj, deletedUids } = await reloadLocalProject(
      fileHandlers[RootNodeUid] as FileSystemDirectoryHandle,
      ffTree,
      osType,
    );
    return { handlerObj, deletedUids };
  } catch (err) {
    LogAllow && console.log("failed to reload local project");
    return { handlerObj: {}, deletedUids: [] };
  }
};
