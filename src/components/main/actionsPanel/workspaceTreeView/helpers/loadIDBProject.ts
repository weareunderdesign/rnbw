import { LogAllow } from "@_constants/global";
import { DefaultProjectPath } from "@_constants/main";
import { reloadIDBProject } from "@_node/file";
import { TNodeTreeData } from "@_node/types";

export const loadIDBProject = async (ffTree: TNodeTreeData) => {
  return { handlerObj: {}, deletedUids: [] };
  try {
    const { handlerObj, deletedUids } = await reloadIDBProject(
      DefaultProjectPath,
      ffTree,
    );
    return { handlerObj, deletedUids };
  } catch (err) {
    LogAllow && console.log("failed to load idb project");
    return { handlerObj: {}, deletedUids: [] };
  }
};
