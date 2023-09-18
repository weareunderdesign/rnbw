import { useDispatch } from "react-redux";
import { useContext } from 'react';

import { TNode, TNodeUid } from "@_node/types";
import { MainContext, setCurrentFile, setFileAction, updateFFTreeViewState } from "@_redux/main";
import { useInvalidNodes, useReloadProject } from "../hooks";
import { moveActions } from "./moveActions";
import { verifyFileHandlerPermission } from "@_services/main";
import { TFileNodeData } from "@_node/file";
import { invalidDirOrFile, renamingError } from "../errors";
import { TFileAction } from "@_types/main";

export const renameNode = async (
	ext: string, 
	newName: string,
	nodeData: TFileNodeData,
	parentNode: TNode,
	parentNodeData: TFileNodeData,
	uid: TNodeUid
	) => {

		const dispatch = useDispatch();
	  
		const {
		  removeRunningActions,
		  project,
		  ffHandlers,
		  addMessage,
		} = useContext(MainContext);
	  
		const { cb_reloadProject } = useReloadProject();
	  
		const { removeInvalidNodes, setInvalidNodes } = useInvalidNodes();
	  
		const { moveIDBFF, moveLocalFF } = moveActions();	

		const _orgName = ext === "*folder" ? `${nodeData.name}` : `${nodeData.name}${nodeData.ext}`;
  
		const _newName = ext === "*folder" ? `${newName}` : `${newName}${ext}`;
  
		const newUid = `${parentNode.uid}/${_newName}`;

		if (project.context === "local") {
			const handler = ffHandlers[uid],
			parentHandler = ffHandlers[
				parentNode.uid
				] as FileSystemDirectoryHandle;
			if (!(await verifyFileHandlerPermission(handler)) ||
			!(await verifyFileHandlerPermission(parentHandler))) {
			addMessage(invalidDirOrFile);

			removeRunningActions(["fileTreeView-rename"], false);
			return;
			}

			setInvalidNodes(newUid);

			try {
			await moveLocalFF(handler, parentHandler, parentHandler, _newName, false, true);
			removeInvalidNodes(newUid);
			} catch (err) {
			addMessage(renamingError);

			removeInvalidNodes(newUid);
			removeRunningActions(["fileTreeView-rename"], false);
			return;
			}
		} else if (project.context === "idb") {
			setInvalidNodes(newUid);

			try {
			await moveIDBFF(nodeData, parentNodeData, _newName, false, true);
			removeInvalidNodes(newUid);
			} catch (err) {
			addMessage(renamingError);

			removeInvalidNodes(newUid);
			removeRunningActions(["fileTreeView-rename"], false);
			return;
			}
		}

		const action: TFileAction = {
			type: "rename",
			param1: { uid, parentUid: parentNode.uid },
			param2: { orgName: _orgName, newName: _newName },
		};
		dispatch(setFileAction(action));

		// update redux
		dispatch(
			setCurrentFile({
			uid: newUid,
			parentUid: parentNode.uid,
			name: nodeData.name,
			content: nodeData.contentInApp as string,
			}),
		);
		dispatch(updateFFTreeViewState({ convertedUids: [[uid, newUid]] }));

		await cb_reloadProject();
		removeRunningActions(["fileTreeView-rename"]);
		
};