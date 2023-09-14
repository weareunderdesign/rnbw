import { useDispatch, useSelector } from "react-redux";
import {useCallback, useContext} from 'react';
import { TreeItem } from "react-complex-tree";

import { 
	MainContext,
	expandFFNode, 
	ffSelector, 
	navigatorSelector, 
	setCurrentFile, 
	setFileAction, 
	updateFFTreeViewState 
} from "@_redux/main";
import { TFileNodeData, createDirectory, getStat, removeFileSystem, writeFile } from "@_node/file";
import { TNode, TNodeTreeData, TNodeUid, TNormalNodeData } from "@_node/types";
import { TFileAction, TFileNodeType } from "@_types/main";
import { verifyFileHandlerPermission } from "@_services/main";
import { 
	deletingWarning,
	duplicatingWarning,
	fileError, 
	folderError, 
	invalidDirError, 
	movingError, 
	renamingError 
} from "../errors";
import { useReloadProject } from "./useReloadProject";
import { HmsClearActionType, RootNodeUid, TmpNodeUid } from "@_constants/main";
import { useInvalidNodes } from "./useInvalidNodes";
import { useTemporaryNodes } from "./useTemporaryNodes";
import { getValidNodeUids } from "@_node/apis";
import { moveActions } from "../helpers";

export const useNodeActionsHandler = (openFileUid: React.MutableRefObject<string>) =>{

  const dispatch = useDispatch();
  const { file } = useSelector(navigatorSelector);

  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // navigator
    project,
    setNavigatorDropDownType,
    // file tree view
    ffTree,
    setFFTree,
    ffHandlers,
    setCurrentFileUid,
    // code view
    showCodeView,
    setShowCodeView,
    // processor
    setUpdateOpt,
    // references
    htmlReferenceData,
    // cmdk
    // other
    osType,
    // toasts
    addMessage,
    // non-parse file
    setParseFile,
    setPrevFileUid,
  } = useContext(MainContext);

  const {
    focusedItem,
    expandedItemsObj,
    selectedItems,
  } = useSelector(ffSelector);

  const { cb_reloadProject } = useReloadProject();

  const { removeInvalidNodes, setInvalidNodes, invalidNodes } = useInvalidNodes();

  const { setTemporaryNodes, removeTemporaryNodes } = useTemporaryNodes();

  const { moveIDBFF, moveLocalFF } = moveActions();
	
	const createFFNode = useCallback(
		async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
		  addRunningActions(["fileTreeView-create"]);
	
		  let newName: string = "";
	
		  if (project.context === "local") {
			// validate
			const parentHandler = ffHandlers[
			  parentUid
			] as FileSystemDirectoryHandle;
			if (!(await verifyFileHandlerPermission(parentHandler))) {
			  addMessage(invalidDirError);
			  removeRunningActions(["fileTreeView-create"], false);
			  return;
			}
	
			if (ffType === "*folder") {
			  // generate new folder name - ex: {aaa - copy}...
			  let folderName = ffName;
			  let exists = true;
			  try {
				await parentHandler.getDirectoryHandle(ffName, { create: false });
				exists = true;
			  } catch (err) {
				exists = false;
			  }
	
			  if (exists) {
				let index = 0;
				while (exists) {
				  const _folderName = `${ffName} (${++index})`;
				  try {
					await parentHandler.getDirectoryHandle(_folderName, {
					  create: false,
					});
					exists = true;
				  } catch (err) {
					folderName = _folderName;
					exists = false;
				  }
				}
			  }
	
			  newName = folderName;
	
			  // create the directory with generated name
			  try {
				await parentHandler.getDirectoryHandle(folderName, {
				  create: true,
				});
			  } catch (err) {
				addMessage(folderError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
			} else {
			  // file
			  // generate new file name - ex: {aaa - copy}...
			  let fileName = `${ffName}.${ffType}`;
			  let exists = true;
			  try {
				await parentHandler.getFileHandle(`${ffName}.${ffType}`, {
				  create: false,
				});
				exists = true;
			  } catch (err) {
				exists = false;
			  }
	
			  if (exists) {
				let index = 0;
				while (exists) {
				  const _fileName = `${ffName} (${++index}).${ffType}`;
				  try {
					await parentHandler.getFileHandle(_fileName, { create: false });
					exists = true;
				  } catch (err) {
					fileName = _fileName;
					exists = false;
				  }
				}
			  }
	
			  newName = fileName;
	
			  // create the file with generated name
			  try {
				await parentHandler.getFileHandle(fileName, { create: true });
			  } catch (err) {
				addMessage(fileError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
			}
		  } else if (project.context === "idb") {
			const parentNode = ffTree[parentUid];
			const parentNodeData = parentNode.data as TFileNodeData;
			if (ffType === "*folder") {
			  // generate new folder name - ex: {aaa - copy}...
			  let folderName = "";
			  let exists = true;
			  try {
				folderName = ffName;
				await getStat(`${parentNodeData.path}/${folderName}`);
				exists = true;
			  } catch (err) {
				exists = false;
			  }
			  if (exists) {
				let index = 0;
				while (exists) {
				  try {
					folderName = `${ffName} (${++index})`;
					await getStat(`${parentNodeData.path}/${folderName}`);
					exists = true;
				  } catch (err) {
					exists = false;
				  }
				}
			  }
			  newName = folderName;
	
			  // create the directory with generated name
			  try {
				await createDirectory(`${parentNodeData.path}/${folderName}`);
			  } catch (err) {
				addMessage(folderError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
			} else {
			  // file
			  // generate new file name - ex: {aaa - copy}...
			  let fileName = "";
			  let exists = true;
			  try {
				fileName = `${ffName}.${ffType}`;
				await getStat(`${parentNodeData.path}/${fileName}`);
				exists = true;
			  } catch (err) {
				exists = false;
			  }
			  if (exists) {
				let index = 0;
				while (exists) {
				  try {
					fileName = `${ffName} (${++index}).${ffType}`;
					await getStat(`${parentNodeData.path}/${fileName}`);
					exists = true;
				  } catch (err) {
					exists = false;
				  }
				}
			  }
			  newName = fileName;
	
			  // create the file with generated name
			  try {
				await writeFile(`${parentNodeData.path}/${fileName}`, "");
			  } catch (err) {
				addMessage(fileError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
			}
		  }
	
		  const action: TFileAction = {
			type: "create",
			param1: `${parentUid}/${newName}`,
			param2: { parentUid, name: newName, type: ffType },
		  };
		  dispatch(setFileAction(action));
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-create"]);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  ffHandlers,
		  cb_reloadProject,
		],
	);

	const createTmpFFNode = useCallback(
		async (ffNodeType: TFileNodeType) => {
		  const tmpTree = JSON.parse(JSON.stringify(ffTree)) as TNodeTreeData;
	
		  // validate
		  let node = tmpTree[focusedItem];
		  if (node === undefined) return;
		  if (node.isEntity) {
			node = tmpTree[node.parentUid as TNodeUid];
		  }
	
		  // expand the focusedItem
		  node.uid !== RootNodeUid &&
			expandedItemsObj[node.uid] === undefined &&
			dispatch(expandFFNode([node.uid]));
	
		  // add tmp node
		  const tmpNode: TNode = {
			uid: `${node.uid}/${TmpNodeUid}`,
			parentUid: node.uid,
			name:
			  ffNodeType === "*folder"
				? "Untitled"
				: ffNodeType === "html"
				? "Untitled"
				: "Untitled",
			isEntity: ffNodeType !== "*folder",
			children: [],
			data: {
			  valid: false,
			  type: ffNodeType,
			},
		  };
	
		  node.children.unshift(tmpNode.uid);
		  tmpTree[tmpNode.uid] = tmpNode;
		  // setFFTree(tmpTree)
	
		  setInvalidNodes(tmpNode.uid);
		  await createFFNode(node.uid as TNodeUid, tmpNode.data.type, tmpNode.name);
		  removeInvalidNodes(tmpNode.uid);
		  setNavigatorDropDownType("project");
	
		  if (ffNodeType !== "*folder") {
			openFileUid.current = `${node.uid}/${tmpNode.name}.${ffNodeType}`;
			setCurrentFileUid(openFileUid.current);
		  }
		},
		[
		  ffTree,
		  focusedItem,
		  expandedItemsObj,
		  setInvalidNodes,
		  createFFNode,
		  setNavigatorDropDownType,
		  removeInvalidNodes,
		  setFFTree,
		],
	);

	const cb_startRenamingNode = useCallback(
		(uid: TNodeUid) => {
		  // validate
		  if (invalidNodes[uid]) {
			removeInvalidNodes(uid);
			return;
		  }
		  setInvalidNodes(uid);
		},
		[invalidNodes, setInvalidNodes, removeInvalidNodes],
	);
	
	const cb_abortRenamingNode = useCallback(
		(item: TreeItem) => {
		  const node = item.data as TNode;
		  const nodeData = node.data as TFileNodeData;
		  if (!nodeData.valid) {
			const tmpTree = JSON.parse(JSON.stringify(ffTree));
			tmpTree[node.parentUid as TNodeUid].children = tmpTree[
			  node.parentUid as TNodeUid
			].children.filter((c_uid: TNodeUid) => c_uid !== node.uid);
			delete tmpTree[item.data.uid];
			setFFTree(tmpTree);
		  }
		  removeInvalidNodes(node.uid);
		},
		[ffTree, removeInvalidNodes],
	);
	  
	const _cb_renameNode = useCallback(
		async (uid: TNodeUid, newName: string, ext: string) => {
		  // validate
		  const node = ffTree[uid];
		  if (node === undefined || node.name === newName) return;
		  const nodeData = node.data as TFileNodeData;
		  const parentNode = ffTree[node.parentUid as TNodeUid];
		  if (parentNode === undefined) return;
		  const parentNodeData = parentNode.data as TFileNodeData;
	
		  addRunningActions(["fileTreeView-rename"]);
	
		  const _orgName =
			ext === "*folder"
			  ? `${nodeData.name}`
			  : `${nodeData.name}${nodeData.ext}`;
		  const _newName = ext === "*folder" ? `${newName}` : `${newName}${ext}`;
		  const newUid = `${parentNode.uid}/${_newName}`;
	
		  if (project.context === "local") {
			// verify handler permission
			const handler = ffHandlers[uid],
			  parentHandler = ffHandlers[
				parentNode.uid
			  ] as FileSystemDirectoryHandle;
			if (
			  !(await verifyFileHandlerPermission(handler)) ||
			  !(await verifyFileHandlerPermission(parentHandler))
			) {
			  addMessage({
				type: "error",
				content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
			  });
	
			  removeRunningActions(["fileTreeView-rename"], false);
			  return;
			}
	
			setInvalidNodes(newUid);
	
			try {
			  await moveLocalFF(
				handler,
				parentHandler,
				parentHandler,
				_newName,
				false,
				true,
			  );
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
	  
	const cb_renameNode = useCallback(
		async (item: TreeItem, newName: string) => {
		  const node = item.data as TNode;
		  const nodeData = node.data as TNormalNodeData;
		  if (!invalidNodes[node.uid]) return;
	
		  if (nodeData.valid) {
			const _file = ffTree[node.uid];
			const _fileData = _file.data as TFileNodeData;
	
			if (_file && _fileData.changed) {
			  // confirm
			  const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
			  if (!window.confirm(message)) {
				removeInvalidNodes(node.uid);
				return;
			  }
			}
	
			setTemporaryNodes(_file.uid);
			await _cb_renameNode(
			  _file.uid,
			  newName,
			  _fileData.kind === "directory" ? "*folder" : _fileData.ext,
			);
			removeTemporaryNodes(_file.uid);
		  } else {
			await createFFNode(node.parentUid as TNodeUid, nodeData.type, newName);
		  }
		  removeInvalidNodes(node.uid);
		},
		[
		  invalidNodes,
		  _cb_renameNode,
		  setTemporaryNodes,
		  removeTemporaryNodes,
		  ffTree,
		  ffHandlers,
		  osType,
		  createFFNode,
		  removeInvalidNodes,
		],
	);
	
	const cb_deleteNode = useCallback(async () => {
		// validate
		const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
		if (uids.length === 0) return;
	
		// confirm msgbox
		const message = `Are you sure you want to delete them? This action cannot be undone!`;
		if (!window.confirm(message)) return;
	
		addRunningActions(["fileTreeView-delete"]);
		setInvalidNodes(...uids);
	
		if (project.context === "local") {
		  let allDone = true;
		  await Promise.all(
			uids.map(async (uid) => {
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) {
				allDone = false;
				return;
			  }
			  const nodeData = node.data as TFileNodeData;
			  const parentNode = ffTree[node.parentUid as TNodeUid];
			  if (parentNode === undefined) {
				allDone = false;
				return;
			  }
			  const parentHandler = ffHandlers[
				parentNode.uid
			  ] as FileSystemDirectoryHandle;
			  if (!(await verifyFileHandlerPermission(parentHandler))) {
				allDone = false;
				return;
			  }
	
			  // delete
			  try {
				const entryName =
				  nodeData.kind === "directory"
					? nodeData.name
					: `${nodeData.name}${nodeData.ext}`;
				await parentHandler.removeEntry(entryName, { recursive: true });
			  } catch (err) {
				allDone = false;
			  }
			}),
		  );
		  if (!allDone) {
			addMessage(deletingWarning);
		  }
		} else if (project.context === "idb") {
		  let allDone = true;
		  await Promise.all(
			uids.map(async (uid) => {
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) {
				allDone = false;
				return;
			  }
			  const nodeData = node.data as TFileNodeData;
	
			  // delete
			  try {
				await removeFileSystem(nodeData.path);
			  } catch (err) {
				allDone = false;
			  }
			}),
		  );
		  if (!allDone) {
			addMessage(deletingWarning);
		  }
		}
	
		removeInvalidNodes(...uids);
		await cb_reloadProject(file.uid);
		removeRunningActions(["fileTreeView-delete"], false);
	  }, [
		addRunningActions,
		removeRunningActions,
		project.context,
		invalidNodes,
		setInvalidNodes,
		removeInvalidNodes,
		selectedItems,
		ffTree,
		ffHandlers,
		cb_reloadProject,
		file.uid,
	]);

	const cb_moveNode = useCallback(
		async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
		  // validate
		  const targetNode = ffTree[targetUid];
		  if (targetNode === undefined) return;
		  const validatedUids = getValidNodeUids(ffTree, uids, targetUid);
		  if (validatedUids.length === 0) return;
	
		  // confirm files' changes
		  let hasChangedFile = false;
		  validatedUids.map((uid) => {
			const _file = ffTree[uid];
			const _fileData = _file.data as TFileNodeData;
			if (_file && _fileData.changed) {
			  hasChangedFile = true;
			}
		  });
		  if (hasChangedFile) {
			const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
			if (!window.confirm(message)) {
			  return;
			}
		  }
	
		  addRunningActions(["fileTreeView-move"]);
	
		  const _uids: { uid: TNodeUid; parentUid: TNodeUid; name: string }[] = [];
		  const _invalidNodes = { ...invalidNodes };
	
		  if (project.context === "local") {
			// verify target handler permission
			const targetHandler = ffHandlers[
			  targetUid
			] as FileSystemDirectoryHandle;
			if (!(await verifyFileHandlerPermission(targetHandler))) {
			  addMessage(invalidDirError);
			  removeRunningActions(["fileTreeView-move"], false);
			  return;
			}
	
			let allDone = true;
			await Promise.all(
			  validatedUids.map(async (uid) => {
				// validate
				const node = ffTree[uid];
				if (node === undefined) {
				  allDone = false;
				  return;
				}
				const nodeData = node.data as TFileNodeData;
				const parentNode = ffTree[node.parentUid as TNodeUid];
				if (parentNode === undefined) {
				  allDone = false;
				  return;
				}
				const handler = ffHandlers[uid],
				  parentHandler = ffHandlers[
					parentNode.uid
				  ] as FileSystemDirectoryHandle;
				if (
				  !(await verifyFileHandlerPermission(handler)) ||
				  !(await verifyFileHandlerPermission(parentHandler))
				) {
				  allDone = false;
				  return;
				}
	
				// generate new name
				let newName =
				  nodeData.kind === "directory"
					? nodeData.name
					: `${nodeData.name}${nodeData.ext}`;
				if (copy) {
				  if (nodeData.kind === "directory") {
					let folderName = "";
					let exists = false;
					try {
					  folderName = nodeData.name;
					  await targetHandler.getDirectoryHandle(folderName, {
						create: false,
					  });
					  exists = true;
					} catch (err) {
					  exists = false;
					}
					if (exists) {
					  try {
						folderName = `${nodeData.name} copy`;
						await targetHandler.getDirectoryHandle(folderName, {
						  create: false,
						});
						exists = true;
					  } catch (err) {
						exists = false;
					  }
					  if (exists) {
						let index = 0;
						while (exists) {
						  try {
							folderName = `${nodeData.name} copy (${++index})`;
							await targetHandler.getDirectoryHandle(folderName, {
							  create: false,
							});
							exists = true;
						  } catch (err) {
							exists = false;
						  }
						}
					  }
					}
					newName = folderName;
				  } else {
					let fileName = "";
					let exists = false;
					try {
					  fileName = `${nodeData.name}${nodeData.ext}`;
					  await targetHandler.getFileHandle(fileName, {
						create: false,
					  });
					  exists = true;
					} catch (err) {
					  exists = false;
					}
					if (exists) {
					  try {
						fileName = `${nodeData.name} copy${nodeData.ext}`;
						await targetHandler.getFileHandle(fileName, {
						  create: false,
						});
						exists = true;
					  } catch (err) {
						exists = false;
					  }
					  if (exists) {
						let index = 0;
						while (exists) {
						  try {
							fileName = `${nodeData.name} copy (${++index})${
							  nodeData.ext
							}`;
							await targetHandler.getFileHandle(fileName, {
							  create: false,
							});
							exists = true;
						  } catch (err) {
							exists = false;
						  }
						}
					  }
					  newName = fileName;
					}
				  }
				}
	
				// update invalidNodes
				const newUid = `${targetUid}/${newName}`;
				_invalidNodes[uid] = true;
				_invalidNodes[newUid] = true;
				setInvalidNodes(...Object.keys(_invalidNodes));
	
				// move
				try {
				  await moveLocalFF(
					handler,
					parentHandler,
					targetHandler,
					newName,
					copy,
				  );
				  _uids.push({ uid, parentUid: parentNode.uid, name: newName });
				} catch (err) {
				  allDone = false;
				}
	
				// update invalidNodes
				delete _invalidNodes[uid];
				delete _invalidNodes[newUid];
				setInvalidNodes(...Object.keys(_invalidNodes));
			  }),
			);
			if (!allDone) {
			  addMessage(movingError);
			}
		  } else if (project.context === "idb") {
			const targetNodeData = targetNode.data as TFileNodeData;
	
			let allDone = true;
			await Promise.all(
			  validatedUids.map(async (uid) => {
				// validate
				const node = ffTree[uid];
				if (node === undefined) {
				  allDone = false;
				  return;
				}
				const nodeData = node.data as TFileNodeData;
	
				// generate new name
				let newName =
				  nodeData.kind === "directory"
					? nodeData.name
					: `${nodeData.name}${nodeData.ext}`;
				if (copy) {
				  if (nodeData.kind === "directory") {
					let folderName = "";
					let exists = false;
					try {
					  folderName = nodeData.name;
					  await getStat(`${targetNodeData.path}/${folderName}`);
					  exists = true;
					} catch (err) {
					  exists = false;
					}
					if (exists) {
					  try {
						folderName = `${nodeData.name} copy`;
						await getStat(`${targetNodeData.path}/${folderName}`);
						exists = true;
					  } catch (err) {
						exists = false;
					  }
					  if (exists) {
						let index = 0;
						while (exists) {
						  try {
							folderName = `${nodeData.name} copy (${++index})`;
							await getStat(`${targetNodeData.path}/${folderName}`);
							exists = true;
						  } catch (err) {
							exists = false;
						  }
						}
					  }
					}
					newName = folderName;
				  } else {
					let fileName = "";
					let exists = false;
					try {
					  fileName = `${nodeData.name}${nodeData.ext}`;
					  await getStat(`${targetNodeData.path}/${fileName}`);
					  exists = true;
					} catch (err) {
					  exists = false;
					}
					if (exists) {
					  try {
						fileName = `${nodeData.name} copy${nodeData.ext}`;
						await getStat(`${targetNodeData.path}/${fileName}`);
						exists = true;
					  } catch (err) {
						exists = false;
					  }
					  if (exists) {
						let index = 0;
						while (exists) {
						  try {
							fileName = `${nodeData.name} copy (${++index})${
							  nodeData.ext
							}`;
							await getStat(`${targetNodeData.path}/${fileName}`);
							exists = true;
						  } catch (err) {
							exists = false;
						  }
						}
					  }
					}
					newName = fileName;
				  }
				}
	
				// update invalidNodes
				const newUid = `${targetUid}/${newName}`;
				_invalidNodes[uid] = true;
				_invalidNodes[newUid] = true;
				setInvalidNodes(...Object.keys(_invalidNodes));
	
				// move
				try {
				  await moveIDBFF(nodeData, targetNodeData, newName, copy);
				  _uids.push({
					uid,
					parentUid: node.parentUid as TNodeUid,
					name: newName,
				  });
				} catch (err) {
				  allDone = false;
				}
	
				// update invalidNodes
				delete _invalidNodes[uid];
				delete _invalidNodes[newUid];
				setInvalidNodes(...Object.keys(_invalidNodes));
			  }),
			);
			if (!allDone) {
			  addMessage(movingError);
			}
		  }
	
		  const action: TFileAction = {
			type: copy ? "copy" : "cut",
			param1: _uids,
			param2: _uids.map(() => targetUid),
		  };
		  dispatch(setFileAction(action));
	
		  await cb_reloadProject();
		  removeRunningActions(["fileTreeView-move"]);
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  project.context,
		  invalidNodes,
		  setInvalidNodes,
		  ffTree,
		  ffHandlers,
		  ,
		  cb_reloadProject,
		],
	);

	const cb_duplicateNode = useCallback(async () => {
		// validate
		const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
		if (uids.length === 0) return;
	
		// confirm files' changes
		let hasChangedFile = false;
		uids.map((uid) => {
		  const _file = ffTree[uid];
		  const _fileData = _file.data as TFileNodeData;
		  if (_file && _fileData.changed) {
			hasChangedFile = true;
		  }
		});
		if (hasChangedFile) {
		  const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
		  if (!window.confirm(message)) {
			return;
		  }
		}
	
		addRunningActions(["fileTreeView-duplicate"]);
	
		const _uids: { uid: TNodeUid; name: string }[] = [];
		const _targetUids: TNodeUid[] = [];
		const _invalidNodes = { ...invalidNodes };
	
		if (project.context === "local") {
		  let allDone = true;
		  await Promise.all(
			uids.map(async (uid) => {
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) {
				allDone = false;
				return;
			  }
			  const nodeData = node.data as TFileNodeData;
			  const parentNode = ffTree[node.parentUid as TNodeUid];
			  if (parentNode === undefined) {
				allDone = false;
				return;
			  }
			  const handler = ffHandlers[node.uid],
				parentHandler = ffHandlers[
				  parentNode.uid
				] as FileSystemDirectoryHandle;
			  if (
				!(await verifyFileHandlerPermission(handler)) ||
				!(await verifyFileHandlerPermission(parentHandler))
			  ) {
				allDone = false;
				return;
			  }
	
			  // generate new name
			  let newName =
				nodeData.kind === "directory"
				  ? `${nodeData.name} copy`
				  : `${nodeData.name} copy${nodeData.ext}`;
			  if (nodeData.kind === "directory") {
				let folderName = "";
				let exists = false;
				try {
				  folderName = `${nodeData.name} copy`;
				  await parentHandler.getDirectoryHandle(folderName, {
					create: false,
				  });
				  exists = true;
				} catch (err) {
				  exists = false;
				}
				if (exists) {
				  let index = 0;
				  while (exists) {
					try {
					  folderName = `${nodeData.name} copy (${++index})`;
					  await parentHandler.getDirectoryHandle(folderName, {
						create: false,
					  });
					  exists = true;
					} catch (err) {
					  exists = false;
					}
				  }
				}
				newName = folderName;
			  } else {
				let fileName = "";
				let exists = true;
				try {
				  fileName = `${nodeData.name} copy${nodeData.ext}`;
				  await parentHandler.getFileHandle(fileName, { create: false });
				  exists = true;
				} catch (err) {
				  exists = false;
				}
				if (exists) {
				  let index = 0;
				  while (exists) {
					try {
					  fileName = `${nodeData.name} copy (${++index})${
						nodeData.ext
					  }`;
					  await parentHandler.getFileHandle(fileName, {
						create: false,
					  });
					  exists = true;
					} catch (err) {
					  exists = false;
					}
				  }
				}
				newName = fileName;
			  }
	
			  // update invalidNodes
			  const newUid = `${node.parentUid}/${newName}`;
			  _invalidNodes[uid] = true;
			  _invalidNodes[newUid] = true;
			  setInvalidNodes(...Object.keys(_invalidNodes));
	
			  // duplicate
			  try {
				await moveLocalFF(
				  handler,
				  parentHandler,
				  parentHandler,
				  newName,
				  true,
				);
				_uids.push({ uid, name: newName });
				_targetUids.push(parentNode.uid);
			  } catch (err) {
				allDone = false;
			  }
	
			  // set invalid nodes
			  delete _invalidNodes[uid];
			  delete _invalidNodes[newUid];
			  setInvalidNodes(...Object.keys(_invalidNodes));
			}),
		  );
		  if (!allDone) {
			addMessage(duplicatingWarning);
		  }
		} else if (project.context === "idb") {
		  let allDone = true;
		  await Promise.all(
			uids.map(async (uid) => {
			  // validate
			  const node = ffTree[uid];
			  if (node === undefined) {
				allDone = false;
				return;
			  }
			  const nodeData = node.data as TFileNodeData;
			  const parentNode = ffTree[node.parentUid as TNodeUid];
			  if (parentNode === undefined) {
				allDone = false;
				return;
			  }
			  const parentNodeData = parentNode.data as TFileNodeData;
	
			  // generate new name
			  let newName =
				nodeData.kind === "directory"
				  ? `${nodeData.name} copy`
				  : `${nodeData.name} copy${nodeData.ext}`;
			  if (nodeData.kind === "directory") {
				let folderName = "";
				let exists = false;
				try {
				  folderName = `${nodeData.name} copy`;
				  await getStat(`${parentNodeData.path}/${folderName}`);
				  exists = true;
				} catch (err) {
				  exists = false;
				}
				if (exists) {
				  let index = 0;
				  while (exists) {
					try {
					  folderName = `${nodeData.name} copy (${++index})`;
					  await getStat(`${parentNodeData.path}/${folderName}`);
					  exists = true;
					} catch (err) {
					  exists = false;
					}
				  }
				}
				newName = folderName;
			  } else {
				let fileName = "";
				let exists = false;
				try {
				  fileName = `${nodeData.name} copy${nodeData.ext}`;
				  await getStat(`${parentNodeData.path}/${fileName}`);
				  exists = true;
				} catch (err) {
				  exists = false;
				}
				if (exists) {
				  let index = 0;
				  while (exists) {
					try {
					  fileName = `${nodeData.name} copy (${++index})${
						nodeData.ext
					  }`;
					  await getStat(`${parentNodeData.path}/${fileName}`);
					  exists = true;
					} catch (err) {
					  exists = false;
					}
				  }
				}
				newName = fileName;
			  }
	
			  // update invalidNodes
			  const newUid = `${node.parentUid}/${newName}`;
			  _invalidNodes[uid] = true;
			  _invalidNodes[newUid] = true;
			  setInvalidNodes(...Object.keys(_invalidNodes));
	
			  // duplicate
			  try {
				await moveIDBFF(nodeData, parentNodeData, newName, true);
				_uids.push({ uid, name: newName });
				_targetUids.push(parentNode.uid);
			  } catch (err) {
				allDone = false;
			  }
	
			  // set invalid nodes
			  delete _invalidNodes[uid];
			  delete _invalidNodes[newUid];
			  setInvalidNodes(...Object.keys(_invalidNodes));
			}),
		  );
		  if (!allDone) {
			addMessage(duplicatingWarning);
		  }
		}
	
		const action: TFileAction = {
		  type: "copy",
		  param1: _uids,
		  param2: _targetUids,
		};
		dispatch(setFileAction(action));
	
		await cb_reloadProject();
		removeRunningActions(["fileTreeView-duplicate"]);
	  }, [
		addRunningActions,
		removeRunningActions,
		project.context,
		invalidNodes,
		setInvalidNodes,
		selectedItems,
		ffTree,
		ffHandlers,
		cb_reloadProject,
	]);
	
	const cb_readNode = useCallback(
		(uid: TNodeUid) => {
		  addRunningActions(["fileTreeView-read"]);
		  dispatch({ type: HmsClearActionType });
		  // validate
		  if (invalidNodes[uid]) {
			removeRunningActions(["fileTreeView-read"], false);
			return;
		  }
		  const node = ffTree[uid];
		  if (node === undefined || !node.isEntity || file.uid === uid) {
			removeRunningActions(["fileTreeView-read"], false);
			return;
		  }
		  const nodeData = node.data as TFileNodeData;
		  if (nodeData.type === "html") {
			setPrevFileUid(file.uid);
		  }
		  if (nodeData.type === "unknown") {
			dispatch(
			  setCurrentFile({
				uid,
				parentUid: node.parentUid as TNodeUid,
				name: nodeData.name,
				content: nodeData.content,
			  }),
			);
			removeRunningActions(["fileTreeView-read"]);
			setParseFile(false);
			showCodeView === false && setShowCodeView(true);
		  } else {
			// set initial content of the html
			let initialContent = "";
			if (
			  nodeData.type === "html" &&
			  nodeData.kind === "file" &&
			  nodeData.content === ""
			) {
			  let doctype = "<!DOCTYPE html>\n";
			  let html = htmlReferenceData["elements"]["html"].Content
				? `<html>\n` +
				  htmlReferenceData["elements"]["html"].Content +
				  `\n</html>`
				: "";
			  initialContent = doctype + html;
			  nodeData.content = initialContent;
			}
			addRunningActions(["processor-updateOpt"]);
			dispatch(
			  setCurrentFile({
				uid,
				parentUid: node.parentUid as TNodeUid,
				name: nodeData.name,
				content: nodeData.content,
			  }),
			);
			setUpdateOpt({ parse: true, from: "file" });
			setParseFile(true);
			removeRunningActions(["fileTreeView-read"]);
			setPrevFileUid(uid);
		  }
		},
		[
		  addRunningActions,
		  removeRunningActions,
		  invalidNodes,
		  ffTree,
		  file.uid,
		  showCodeView,
		],
	);
	
	return{
		createFFNode,
		createTmpFFNode,
		cb_startRenamingNode,
		cb_abortRenamingNode,
		cb_renameNode,
		_cb_renameNode,
		cb_deleteNode,
		cb_moveNode,
		cb_duplicateNode,
		cb_readNode
	}

}