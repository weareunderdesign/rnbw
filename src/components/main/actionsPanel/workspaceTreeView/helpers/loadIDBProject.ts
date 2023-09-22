import { DefaultProjectPath, LogAllow } from "@_constants/main";
import { reloadIDBProject } from "@_node/file";
import { TNodeTreeData } from "@_node/types";

export const loadIDBProject = async (ffTree: TNodeTreeData) => {
  try {
    const { handlerObj, deletedUids } = await reloadIDBProject(
      DefaultProjectPath,
      ffTree,
    );
    return { handlerObj, deletedUids };
  } catch (err) {
    LogAllow && console.log("failed to reload welcome project");
    return { handlerObj: {}, deletedUids: [] };
  }
};
