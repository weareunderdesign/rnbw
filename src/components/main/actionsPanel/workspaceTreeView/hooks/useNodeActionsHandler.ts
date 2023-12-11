import { useCallback, useContext } from "react";

import { TreeItem } from "react-complex-tree";
import { useDispatch } from "react-redux";

import { RednerableFileTypes, RootNodeUid, TmpNodeUid } from "@_constants/main";
import {
  createDirectory,
  loadLocalProject,
  TFileNodeData,
  triggerFileChangeAlert,
  writeFile,
} from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  expandFileTreeNodes,
  setCurrentFileUid,
  setFileTree,
  setPrevRenderableFileUid,
} from "@_redux/main/fileTree";
import { setFileAction, TFileAction } from "@_redux/main/fileTree/event";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import {
  setNavigatorDropdownType,
  setShowCodeView,
} from "@_redux/main/processor";
import { verifyFileHandlerPermission } from "@_services/main";
import { TFileNodeType } from "@_types/main";

import {
  duplicateNode,
  generateNewName,
  renameNode,
  validateAndDeleteNode,
  validateAndMoveNode,
} from "../helpers";
import { useInvalidNodes } from "./useInvalidNodes";
import { useTemporaryNodes } from "./useTemporaryNodes";
import { useAppState } from "@_redux/useAppState";
import { clearFileSession } from "@_pages/main/helper";

export const useNodeActionsHandler = (
  openFileUid: React.MutableRefObject<string>,
) => {
  const dispatch = useDispatch();
  const {
    project,
    currentFileUid,
    fileTree,
    osType,
    showCodeView,
    fFocusedItem: focusedItem,
    fExpandedItemsObj: expandedItemsObj,
    fSelectedItems: selectedItems,
  } = useAppState();
  const {
    addRunningActions,
    removeRunningActions,
    fileHandlers,
    htmlReferenceData,
    currentProjectFileHandle,
  } = useContext(MainContext);

  const { removeInvalidNodes, setInvalidNodes, invalidNodes } =
    useInvalidNodes();
  const { temporaryNodes, setTemporaryNodes, removeTemporaryNodes } =
    useTemporaryNodes();

  const createFFNode = useCallback(
    async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
      let newName: string = "";

      if (project.context === "local") {
        const parentHandler = fileHandlers[
          parentUid
        ] as FileSystemDirectoryHandle;
        if (!(await verifyFileHandlerPermission(parentHandler))) {
          removeRunningActions(["fileTreeView-create"]);
          return;
        }

        newName = await generateNewName(parentHandler, ffType, ffName);

        // create the directory with generated name
        try {
          await parentHandler.getDirectoryHandle(newName, {
            create: true,
          });
        } catch (err) {
          removeRunningActions(["fileTreeView-create"]);
          return;
        }
      } else if (project.context === "idb") {
        const parentNode = fileTree[parentUid];
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
          removeRunningActions(["fileTreeView-create"]);
          return;
        }
      }

      const action: TFileAction = {
        type: "create",
        param1: `${parentUid}/${newName}`,
        param2: { parentUid, name: newName, type: ffType },
      };
      dispatch(setFileAction(action));

      removeRunningActions(["fileTreeView-create"]);
    },
    [addRunningActions, removeRunningActions, project.context, fileHandlers],
  );
  const createTmpFFNode = useCallback(
    async (ffNodeType: TFileNodeType) => {
      const tmpTree = JSON.parse(JSON.stringify(fileTree)) as TNodeTreeData;

      // validate
      let node = tmpTree[focusedItem];
      if (node === undefined) return;
      if (node.isEntity) {
        node = tmpTree[node.parentUid as TNodeUid];
      }

      // expand the focusedItem
      node.uid !== RootNodeUid &&
        expandedItemsObj[node.uid] === undefined &&
        dispatch(expandFileTreeNodes([node.uid]));

      // add tmp node
      const tmpNode: TNode = {
        uid: `${node.uid}/${TmpNodeUid}`,
        parentUid: node.uid,
        displayName:
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
          sourceCodeLocation: {
            startCol: 0,
            endCol: 0,
            endLine: 0,
            startLine: 0,
            endOffset: 0,
            startOffset: 0,
          },
        },
      };

      node.children.unshift(tmpNode.uid);
      tmpTree[tmpNode.uid] = tmpNode;
      // setFFTree(tmpTree)

      setInvalidNodes(tmpNode.uid);
      await createFFNode(
        node.uid as TNodeUid,
        tmpNode.data.type,
        tmpNode.displayName,
      );
      removeInvalidNodes(tmpNode.uid);
      dispatch(setNavigatorDropdownType("project"));

      if (ffNodeType !== "*folder") {
        openFileUid.current = `${node.uid}/${tmpNode.displayName}.${ffNodeType}`;
        dispatch(setCurrentFileUid(openFileUid.current));
      }
    },
    [
      fileTree,
      focusedItem,
      expandedItemsObj,
      setInvalidNodes,
      createFFNode,
      removeInvalidNodes,
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
        const tmpTree = structuredClone(fileTree);
        tmpTree[node.parentUid as TNodeUid].children = tmpTree[
          node.parentUid as TNodeUid
        ].children.filter((c_uid: TNodeUid) => c_uid !== node.uid);
        delete tmpTree[item.data.uid];
        dispatch(setFileTree(tmpTree));
      }
      removeInvalidNodes(node.uid);
    },
    [fileTree, removeInvalidNodes],
  );
  const _cb_renameNode = useCallback(
    async (uid: TNodeUid, newName: string, ext: string) => {
      // validate
      const node = fileTree[uid];
      if (node === undefined || node.displayName === newName) return;
      const nodeData = node.data as TFileNodeData;
      const parentNode = fileTree[node.parentUid as TNodeUid];
      if (parentNode === undefined) return;
      const parentNodeData = parentNode.data as TFileNodeData;

      addRunningActions(["fileTreeView-rename"]);

      renameNode(ext, newName, nodeData, parentNode, parentNodeData, uid);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      setInvalidNodes,
      removeInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );
  const cb_renameNode = useCallback(
    async (item: TreeItem, newName: string) => {
      const node = item.data as TNode;
      const nodeData = node.data as TFileNodeData;
      if (!invalidNodes[node.uid]) return;

      if (nodeData.valid) {
        const _file = fileTree[node.uid];
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
        await createFFNode(
          node.parentUid as TNodeUid,
          nodeData.ext as TFileNodeType,
          newName,
        );
      }
      removeInvalidNodes(node.uid);
    },
    [
      invalidNodes,
      _cb_renameNode,
      setTemporaryNodes,
      removeTemporaryNodes,
      fileTree,
      fileHandlers,
      osType,
      createFFNode,
      removeInvalidNodes,
    ],
  );

  const cb_deleteNode = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;

    const message = `Are you sure you want to delete them? This action cannot be undone!`;
    if (!window.confirm(message)) return;

    addRunningActions(["fileTreeView-delete"]);
    setInvalidNodes(...uids);

    if (project.context === "local") {
      const allDone = await Promise.all(
        uids.map((uid) => validateAndDeleteNode(uid, fileTree, fileHandlers)),
      ).then((results) => results.every(Boolean));

      if (!allDone) {
      }
    } else if (project.context === "idb") {
      const allDone = await Promise.all(
        uids.map((uid) => validateAndDeleteNode(uid, fileTree, fileHandlers)),
      ).then((results) => results.every(Boolean));

      if (!allDone) {
        // addMessage(deletingWarning);
      }
    }

    removeInvalidNodes(...uids);
    const { _fileTree } = await loadLocalProject(
      currentProjectFileHandle as FileSystemDirectoryHandle,
      osType,
      true,
      fileTree,
    );
    dispatch(setFileTree(_fileTree));
    removeRunningActions(["fileTreeView-delete"]);
  }, [
    addRunningActions,
    removeRunningActions,
    selectedItems,
    invalidNodes,
    setInvalidNodes,
    removeInvalidNodes,
    project.context,
    fileTree,
    fileHandlers,
    currentProjectFileHandle,
    currentFileUid,
  ]);

  const cb_moveNode = useCallback(
    async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
      // validate
      const targetNode = fileTree[targetUid];

      if (targetNode === undefined) {
        return;
      }

      const validatedUids = getValidNodeUids(fileTree, uids, targetUid);

      if (validatedUids.length === 0) {
        return;
      }

      // confirm files' changes
      const hasChangedFile = validatedUids.some((uid) => {
        const _file = fileTree[uid];
        const _fileData = _file.data as TFileNodeData;
        return _file && _fileData.changed;
      });

      if (hasChangedFile) {
        triggerFileChangeAlert();
      }

      addRunningActions(["fileTreeView-move"]);

      const _uids = await Promise.all(
        validatedUids.map((uid) => validateAndMoveNode(uid, targetUid, copy)),
      );

      if (_uids.some((result) => !result)) {
        // addMessage(movingError);
      }

      const action: TFileAction = {
        type: copy ? "copy" : "cut",
        param1: _uids,
        param2: _uids.map(() => targetUid),
      };
      dispatch(setFileAction(action));

      removeRunningActions(["fileTreeView-move"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      invalidNodes,
      setInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );

  const cb_duplicateNode = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;

    let hasChangedFile = false;
    uids.forEach((uid) => {
      const _file = fileTree[uid];
      const _fileData = _file.data as TFileNodeData;
      if (_file && _fileData.changed) {
        hasChangedFile = true;
      }
    });

    if (
      hasChangedFile &&
      !window.confirm(
        "Your changes will be lost if you don't save them. Are you sure you want to continue without saving?",
      )
    ) {
      return;
    }

    addRunningActions(["fileTreeView-duplicate"]);

    const _uids: { uid: TNodeUid; name: string }[] = [];
    const _targetUids: TNodeUid[] = [];
    const _invalidNodes = { ...invalidNodes };

    let allDone = true;
    await Promise.all(
      uids.map(async (uid) => {
        const result = await duplicateNode(
          uid,
          true,
          fileTree,
          fileHandlers,
          () => {},
          setInvalidNodes,
          invalidNodes,
        );
        if (result) {
          _uids.push(result);
          _targetUids.push(fileTree[uid].parentUid as TNodeUid);
        } else {
          allDone = false;
        }
      }),
    );

    if (!allDone) {
      // addMessage(duplicatingWarning);
    }

    const action: TFileAction = {
      type: "copy",
      param1: _uids,
      param2: _targetUids,
    };

    dispatch(setFileAction(action));

    removeRunningActions(["fileTreeView-duplicate"]);
  }, [
    addRunningActions,
    removeRunningActions,
    project.context,
    invalidNodes,
    setInvalidNodes,
    selectedItems,
    fileTree,
    fileHandlers,
  ]);

  const cb_readNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["fileTreeView-read"]);

      // validate
      if (invalidNodes[uid]) {
        removeRunningActions(["fileTreeView-read"]);
        return;
      }
      const node = structuredClone(fileTree[uid]);
      if (node === undefined || !node.isEntity || currentFileUid === uid) {
        removeRunningActions(["fileTreeView-read"]);
        return;
      }

      clearFileSession(dispatch);

      const nodeData = node.data as TFileNodeData;
      if (RednerableFileTypes[nodeData.ext]) {
        dispatch(setPrevRenderableFileUid(uid));

        // set initial content of the html if file content is empty
        if (
          nodeData.ext === "html" &&
          nodeData.kind === "file" &&
          nodeData.content === ""
        ) {
          const doctype = "<!DOCTYPE html>\n";
          const html = htmlReferenceData["elements"]["html"].Content
            ? `<html>\n` +
              htmlReferenceData["elements"]["html"].Content +
              `\n</html>`
            : "";
          nodeData.content = doctype + html;
        }
      }

      dispatch(setCurrentFileUid(uid));
      dispatch(setCurrentFileContent(nodeData.content));

      removeRunningActions(["fileTreeView-read"]);

      showCodeView === false && dispatch(setShowCodeView(true));
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      fileTree,
      currentFileUid,
      showCodeView,
    ],
  );

  return {
    createFFNode,
    createTmpFFNode,
    cb_startRenamingNode,
    cb_abortRenamingNode,
    cb_renameNode,
    _cb_renameNode,
    cb_deleteNode,
    cb_moveNode,
    cb_duplicateNode,
    cb_readNode,
  };
};
