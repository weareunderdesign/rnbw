import { useContext } from "react";

import { DefaultProjectPath, LogAllow } from "@_constants/main";
import { reloadIDBProject } from "@_node/file";
import { MainContext } from "@_redux/main";

export const loadIDBProject = async() => {
	const {ffTree} = useContext(MainContext);
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
  }