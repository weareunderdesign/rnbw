import { useContext } from "react";

import { useInvalidNodes } from "../hooks";
import { moveActions } from "./moveActions";
import { MainContext } from "@_redux/main";
import { TFileNodeData } from "@_node/file";
import { TNodeUid } from "@_node/types";
import { verifyFileHandlerPermission } from "@_services/main";
import { generateNewNameMoveNode } from "./generateNewNameMoveNode";

export const validateAndMoveNode = async (
	uid : string, 
	targetUid: TNodeUid, 
	copy: boolean = false
) => {

  const {
    project,
    ffTree,
    ffHandlers,
  } = useContext(MainContext);

  const { setInvalidNodes }: any = useInvalidNodes();

  const { moveIDBFF, moveLocalFF } = moveActions();

	const node = ffTree[uid];

	if (node === undefined) {
	  return false;
	}

	const nodeData = node.data as TFileNodeData;
	const parentNode = ffTree[node.parentUid as TNodeUid];

	if (parentNode === undefined) {
	  return false;
	}

	const handler = ffHandlers[uid];
	const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle;

	if (
	  !(await verifyFileHandlerPermission(handler)) ||
	  !(await verifyFileHandlerPermission(parentHandler))
	) {
	  return false;
	}

	const newUid = `${targetUid}/${await generateNewNameMoveNode(
	  nodeData,
	  parentHandler,
	  copy
	)}`;

	// update invalidNodes
	setInvalidNodes((prevState:  Record<string, boolean>) => ({
	  ...prevState,
	  [uid]: true,
	  [newUid]: true,
	}));

	// move
	try {
	  if (project.context === "local") {
		await moveLocalFF(handler, parentHandler, parentHandler, newUid, copy);
	  } else if (project.context === "idb") {
		const targetNode = ffTree[targetUid];
		const targetNodeData = targetNode.data as TFileNodeData;
		await moveIDBFF(nodeData, targetNodeData, newUid, copy);
	  }
	  return true;
	} catch (err) {
	  return false;
	} finally {
	  // update invalidNodes
	  setInvalidNodes((prevState:  Record<string, boolean>) => {
		delete prevState[uid];
		delete prevState[newUid];
		return { ...prevState };
	  });
	}
  };