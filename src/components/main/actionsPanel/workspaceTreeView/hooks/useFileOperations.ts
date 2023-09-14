import {useCallback, useContext} from 'react'

import { TNodeUid } from '@_node/types';
import { MainContext } from '@_redux/main';
import { TFileNodeType } from '@_types/main';
import { useReloadProject } from './useReloadProject';
import { verifyFileHandlerPermission } from '@_services/main';
import { TFileNodeData, createDirectory, removeFileSystem, writeFile } from '@_node/file';
import { useInvalidNodes } from './useInvalidNodes';
import { useTemporaryNodes } from './useTemporaryNodes';
import { moveActions } from '../helpers';

export const useFileOperations = () =>{

	const {cb_reloadProject} = useReloadProject();

	const {removeInvalidNodes, setInvalidNodes, invalidNodes} = useInvalidNodes();

	const {setTemporaryNodes, removeTemporaryNodes} = useTemporaryNodes();

	const { moveIDBFF, moveLocalFF } = moveActions();

	const {
		// global action
		addRunningActions,
		removeRunningActions,
		// navigator
		project,
		// file tree view
		ffTree,
		ffHandlers,
	  } = useContext(MainContext);

	const _create = useCallback(
		async (params: {
		  parentUid: TNodeUid;
		  name: string;
		  type: TFileNodeType;
		}) => {
		  addRunningActions(["fileTreeView-create"]);
	
		  const { parentUid, name, type } = params;
		  try {
			// validate
			const parentNode = ffTree[parentUid];
			if (parentNode === undefined) throw "error";
			const parentNodeData = parentNode.data as TFileNodeData;
	
			if (project.context === "local") {
			  // verify handler permission
			  const parentHandler = ffHandlers[
				parentNode.uid
			  ] as FileSystemDirectoryHandle;
			  if (!(await verifyFileHandlerPermission(parentHandler)))
				throw "error";
	
			  // create
			  if (type === "*folder") {
				await parentHandler.getDirectoryHandle(name, { create: true });
			  } else {
				// file
				await parentHandler.getFileHandle(name, { create: true });
			  }
			} else if (project.context === "idb") {
			  // create
			  if (type === "*folder") {
				await createDirectory(`${parentNodeData.path}/${name}`);
			  } else {
				await writeFile(`${parentNodeData.path}/${name}`, "");
			  }
			}
		  } catch (err) {}
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-create"], false);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  ffTree,
		  ffHandlers,
		  cb_reloadProject,
		],
	  );

	  const _delete = useCallback(
		async (uids: TNodeUid[]) => {
		  addRunningActions(["fileTreeView-delete"]);
		  setInvalidNodes(...uids);
	
		  await Promise.all(
			uids.map(async (uid) => {
			  try {
				// validate
				const node = ffTree[uid];
				if (node === undefined) throw "error";
				const nodeData = node.data as TFileNodeData;
				const parentNode = ffTree[node.parentUid as TNodeUid];
				if (parentNode === undefined) throw "error";
				const parentNodeData = parentNode.data as TFileNodeData;
	
				if (project.context === "local") {
				  const parentHandler = ffHandlers[
					parentNode.uid
				  ] as FileSystemDirectoryHandle;
				  if (!(await verifyFileHandlerPermission(parentHandler)))
					throw "error";
	
				  // delete
				  try {
					const entryName =
					  nodeData.kind === "directory"
						? nodeData.name
						: `${nodeData.name}${nodeData.ext}`;
					await parentHandler.removeEntry(entryName, { recursive: true });
				  } catch (err) {}
				} else if (project.context === "idb") {
				  // delete
				  try {
					const entryName =
					  nodeData.kind === "directory"
						? nodeData.name
						: `${nodeData.name}${nodeData.ext}`;
					await removeFileSystem(`${parentNodeData.path}/${entryName}`);
				  } catch (err) {}
				}
			  } catch (err) {}
			}),
		  );
	
		  removeInvalidNodes(...uids);
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-delete"], false);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  setInvalidNodes,
		  removeInvalidNodes,
		  ffTree,
		  ffHandlers,
		  cb_reloadProject,
		],
	  );
	  const _rename = useCallback(
		async (uid: TNodeUid, newName: string) => {
		  addRunningActions(["fileTreeView-rename"]);
	
		  try {
			// validate
			const node = ffTree[uid];
			if (node === undefined || node.name === newName) throw "error";
			const nodeData = node.data as TFileNodeData;
			const parentNode = ffTree[node.parentUid as TNodeUid];
			if (parentNode === undefined) throw "error";
			const parentNodeData = parentNode.data as TFileNodeData;
	
			const newUid = `${parentNode.uid}/${newName}`;
			setTemporaryNodes(uid);
			setInvalidNodes(newUid);
	
			if (project.context === "local") {
			  const handler = ffHandlers[uid],
				parentHandler = ffHandlers[
				  parentNode.uid
				] as FileSystemDirectoryHandle;
			  if (
				!(await verifyFileHandlerPermission(handler)) ||
				!(await verifyFileHandlerPermission(parentHandler))
			  )
				throw "error";
	
			  await moveLocalFF(handler, parentHandler, parentHandler, newName);
			} else if (project.context === "idb") {
			  await moveIDBFF(nodeData, parentNodeData, newName);
			}
	
			removeInvalidNodes(newUid);
			removeTemporaryNodes(uid);
		  } catch (err) {}
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-rename"], false);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  setTemporaryNodes,
		  removeTemporaryNodes,
		  setInvalidNodes,
		  removeInvalidNodes,
		  ffTree,
		  ffHandlers,
		  cb_reloadProject,
		],
	  );
	  const _cut = useCallback(
		async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
		  addRunningActions(["fileTreeView-move"]);
	
		  const _invalidNodes = { ...invalidNodes };
	
		  await Promise.all(
			uids.map(async (uid, index) => {
			  const targetUid = targetUids[index];
	
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) return;
			  const nodeData = node.data as TFileNodeData;
			  const parentNode = ffTree[node.parentUid as TNodeUid];
			  if (parentNode === undefined) return;
			  const targetNode = ffTree[targetUid];
			  if (targetNode === undefined) return;
			  const targetNodeData = targetNode.data as TFileNodeData;
	
			  const newUid = `${targetUid}/${nodeData.name}`;
			  _invalidNodes[uid] = true;
			  _invalidNodes[newUid] = true;
			  setInvalidNodes(...Object.keys(_invalidNodes));
	
			  if (project.context === "local") {
				const handler = ffHandlers[uid],
				  parentHandler = ffHandlers[
					parentNode.uid
				  ] as FileSystemDirectoryHandle,
				  targetHandler = ffHandlers[
					targetUid
				  ] as FileSystemDirectoryHandle;
				if (
				  !(await verifyFileHandlerPermission(handler)) ||
				  !(await verifyFileHandlerPermission(parentHandler)) ||
				  !(await verifyFileHandlerPermission(targetHandler))
				)
				  return;
	
				try {
				  await moveLocalFF(
					handler,
					parentHandler,
					targetHandler,
					nodeData.name,
				  );
				} catch (err) {}
			  } else if (project.context === "idb") {
				await moveIDBFF(nodeData, targetNodeData, nodeData.name);
			  }
	
			  delete _invalidNodes[uid];
			  delete _invalidNodes[newUid];
			  setInvalidNodes(...Object.keys(_invalidNodes));
			}),
		  );
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-move"], false);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  invalidNodes,
		  setInvalidNodes,
		  ffTree,
		  ffHandlers,
		  cb_reloadProject,
		],
	  );
	  const _copy = useCallback(
		async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
		  addRunningActions(["fileTreeView-duplicate"]);
	
		  const _invalidNodes = { ...invalidNodes };
	
		  await Promise.all(
			uids.map(async (uid, index) => {
			  const name = names[index];
			  const targetUid = targetUids[index];
	
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) return;
			  const nodeData = node.data as TFileNodeData;
			  const parentNode = ffTree[node.parentUid as TNodeUid];
			  if (parentNode === undefined) return;
			  const targetNode = ffTree[targetUid];
			  if (targetNode === undefined) return;
			  const targetNodeData = targetNode.data as TFileNodeData;
	
			  const newUid = `${targetUid}/${name}`;
			  _invalidNodes[uid] = true;
			  _invalidNodes[newUid] = true;
			  setInvalidNodes(...Object.keys(_invalidNodes));
	
			  if (project.context === "local") {
				const handler = ffHandlers[uid],
				  parentHandler = ffHandlers[
					parentNode.uid
				  ] as FileSystemDirectoryHandle,
				  targetHandler = ffHandlers[
					targetUid
				  ] as FileSystemDirectoryHandle;
				if (
				  !(await verifyFileHandlerPermission(handler)) ||
				  !(await verifyFileHandlerPermission(parentHandler)) ||
				  !(await verifyFileHandlerPermission(targetHandler))
				)
				  return;
	
				try {
				  await moveLocalFF(
					handler,
					parentHandler,
					targetHandler,
					name,
					true,
				  );
				} catch (err) {
				  console.log(err);
				}
			  } else if (project.context === "idb") {
				await moveIDBFF(nodeData, targetNodeData, nodeData.name, true);
			  }
	
			  delete _invalidNodes[uid];
			  delete _invalidNodes[newUid];
			  setInvalidNodes(...Object.keys(_invalidNodes));
			}),
		  );
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-duplicate"], false);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  invalidNodes,
		  setInvalidNodes,
		  ffTree,
		  ffHandlers,
		  cb_reloadProject,
		],
	  );

	return {
		_copy,
		_create,
		_cut,
		_delete,
		_rename		
	}
}


