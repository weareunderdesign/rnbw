import { useContext } from 'react';

import { TNodeUid } from "@_node/types";
import { moveActions } from "./moveActions";
import { useInvalidNodes } from "../hooks";
import { MainContext } from "@_redux/main";
import { TFileNodeData } from "@_node/file";
import { verifyFileHandlerPermission } from "@_services/main";
import { duplicatingWarning, invalidDirError } from "../errors";
import { generateNewNodeName } from ".";

export const duplicateNode = async (uid: TNodeUid, isCopy: boolean) => {

	const {
	  ffTree,
	  ffHandlers,
	  addMessage,
	} = useContext(MainContext);
  
	const { setInvalidNodes, invalidNodes } : any = useInvalidNodes();
  
	const { moveLocalFF } = moveActions();

	const node = ffTree[uid];
	if (!node) return;
  
	const nodeData = node.data as TFileNodeData;
	const parentNode = ffTree[node.parentUid as TNodeUid];
	if (!parentNode) return;
  
	const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle;
  
	if (!(await verifyFileHandlerPermission(parentHandler))) {
	  addMessage(invalidDirError);
	  return;
	}
  
	const newName = await generateNewNodeName(
	  parentHandler,
	  nodeData.name,
	  nodeData.kind === "directory",
	  nodeData.ext
	);
  
	const newUid = `${node.parentUid}/${newName}`;
	setInvalidNodes({ ...invalidNodes, [uid]: true, [newUid]: true });
  
	try {
	  await moveLocalFF(
		ffHandlers[uid],
		parentHandler,
		parentHandler,
		newName,
		true
	  );
	} catch (err) {
	  addMessage(duplicatingWarning);
	}
  
	delete invalidNodes[uid];
	delete invalidNodes[newUid];
	setInvalidNodes({ ...invalidNodes });
  
	return { uid, name: newName };
  };
  