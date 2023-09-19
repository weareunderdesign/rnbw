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
} from "@_redux/main";
import { TFileNodeData, createDirectory, writeFile } from "@_node/file";
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
} from "../errors";
import { useReloadProject } from "./useReloadProject";
import { HmsClearActionType, RootNodeUid, TmpNodeUid } from "@_constants/main";
import { useInvalidNodes } from "./useInvalidNodes";
import { useTemporaryNodes } from "./useTemporaryNodes";
import { getValidNodeUids } from "@_node/apis";
import { 
	duplicateNode, 
	generateNewName, 
	renameNode, 
	validateAndDeleteNode, 
	validateAndMoveNode 
} from "../helpers";

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

	const createFFNode = useCallback(
		async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
			let newName: string = "";

			if (project.context === "local") {
			  const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle;
			  if (!(await verifyFileHandlerPermission(parentHandler))) {
				addMessage(invalidDirError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
		
			  newName = await generateNewName(parentHandler, ffType, ffName);
		
			  // create the directory with generated name
			  try {
				await parentHandler.getDirectoryHandle(newName, {
				  create: true,
				});
			  } catch (err) {
				addMessage(folderError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
			  }
			} else if (project.context === "idb") {
			  const parentNode = ffTree[parentUid];
			  const parentNodeData = parentNode.data as TFileNodeData;
		
			  newName = await generateNewName(undefined, ffType, ffName);
		
			  // create the directory or file with generated name
			  try {
				if (ffType === "*folder") {
				  await createDirectory(`${parentNodeData.path}/${newName}`);
				} else {
				  await writeFile(`${parentNodeData.path}/${newName}`, "");
				}
			  } catch (err) {
				addMessage(ffType === "*folder" ? folderError : fileError);
				removeRunningActions(["fileTreeView-create"], false);
				return;
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
		  ]
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
	
		  renameNode(
			ext,
			newName,
			nodeData,
			parentNode,
			parentNodeData,
			uid
		)
	
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

		if (uids.length === 0) {
		  return;
		}
	  
		// confirm msgbox
		const message = `Are you sure you want to delete them? This action cannot be undone!`;
	  
		if (!window.confirm(message)) {
		  return;
		}
	  
		addRunningActions(["fileTreeView-delete"]);
		setInvalidNodes(...uids);
	  
		if (project.context === "local") {
		  const allDone = await Promise.all(uids.map(validateAndDeleteNode)).then(
			(results) => results.every(Boolean)
		  );
	  
		  if (!allDone) {
			addMessage(deletingWarning);
		  }
		} else if (project.context === "idb") {
		  const allDone = await Promise.all(uids.map(validateAndDeleteNode)).then(
			(results) => results.every(Boolean)
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

		   if (targetNode === undefined) {
			 return;
		   }
	   
		   const validatedUids = getValidNodeUids(ffTree, uids, targetUid);
	   
		   if (validatedUids.length === 0) {
			 return;
		   }
	   
		   // confirm files' changes
		   const hasChangedFile = validatedUids.some((uid) => {
			 const _file = ffTree[uid];
			 const _fileData = _file.data as TFileNodeData;
			 return _file && _fileData.changed;
		   });
	   
		   if (hasChangedFile) {
			 const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
	   
			 if (!window.confirm(message)) {
			   return;
			 }
		   }
	   
		   addRunningActions(["fileTreeView-move"]);
	   
		   const _uids = await Promise.all(
			 validatedUids.map((uid) => validateAndMoveNode(
				uid,
				targetUid, 
				copy
			))
		   );
	   
		   if (_uids.some((result) => !result)) {
			 addMessage(movingError);
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
		const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
		if (uids.length === 0) return;

		let hasChangedFile = false;
		uids.forEach((uid) => {
			const _file = ffTree[uid];
			const _fileData = _file.data as TFileNodeData;
			if (_file && _fileData.changed) {
			hasChangedFile = true;
			}
		});

		if (hasChangedFile && !window.confirm("Your changes will be lost if you don't save them. Are you sure you want to continue without saving?")) {
			return;
		}

		addRunningActions(["fileTreeView-duplicate"]);

		const _uids: { uid: TNodeUid; name: string }[] = [];
		const _targetUids: TNodeUid[] = [];
		const _invalidNodes = { ...invalidNodes };

		let allDone = true;
		await Promise.all(
			uids.map(async (uid) => {
			const result = await duplicateNode(uid, true);
			if (result) {
				_uids.push(result);
				_targetUids.push(ffTree[uid].parentUid as TNodeUid);
			} else {
				allDone = false;
			}
			})
		);

		if (!allDone) {
			addMessage(duplicatingWarning);
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