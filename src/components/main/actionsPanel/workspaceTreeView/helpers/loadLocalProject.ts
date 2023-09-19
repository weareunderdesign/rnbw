import { useContext } from "react";

import { LogAllow, RootNodeUid } from "@_constants/main";
import { reloadLocalProject } from "@_node/file";
import { MainContext } from "@_redux/main";

export const loadLocalProject = async() => {
	const {
		ffTree,
		ffHandlers,
		osType,
	  } = useContext(MainContext);
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
  }