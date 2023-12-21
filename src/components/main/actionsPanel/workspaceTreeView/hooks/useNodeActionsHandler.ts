import { useCallback, useContext, useEffect, useState } from "react";

import { TreeItem } from "react-complex-tree";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import {
  FileChangeAlertMessage,
  RednerableFileTypes,
  RootNodeUid,
  TmpFileNodeUidWhenAddNew,
} from "@_constants/main";
import { callFileApi } from "@_node/apis";
import {
  _createIDBDirectory,
  _path,
  _writeIDBFile,
  confirmAlert,
  TFileNodeData,
  TFileNodeTreeData,
} from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { clearFileSession } from "@_pages/main/helper";
import { MainContext } from "@_redux/main";
import {
  expandFileTreeNodes,
  setCurrentFileUid,
  setDoingFileAction,
  setFileAction,
  setFileTree,
  setPrevRenderableFileUid,
  TFileAction,
} from "@_redux/main/fileTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import { setShowCodeView } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

interface IUseNodeActionsHandler {
  invalidNodes: {
    [uid: string]: true;
  };
  addInvalidNodes: (...uids: string[]) => void;
  removeInvalidNodes: (...uids: string[]) => void;
  temporaryNodes: {
    [uid: string]: true;
  };
  addTemporaryNodes: (...uids: string[]) => void;
  removeTemporaryNodes: (...uids: string[]) => void;
  openFileUid: React.MutableRefObject<string>;
}
export const useNodeActionsHandler = ({
  invalidNodes,
  addInvalidNodes,
  removeInvalidNodes,
  temporaryNodes,
  addTemporaryNodes,
  removeTemporaryNodes,
  openFileUid,
}: IUseNodeActionsHandler) => {
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
    nodeTree,
    clipboardData,
  } = useAppState();
  const {
    addRunningActions,
    removeRunningActions,
    fileHandlers,
    htmlReferenceData,
    reloadCurrentProject,
  } = useContext(MainContext);

  // current project - reload trigger
  const [reloadCurrentProjectTrigger, setReloadCurrentProjectTrigger] =
    useState(false);
  useEffect(() => {
    reloadCurrentProject();
  }, [reloadCurrentProjectTrigger]);

  // Add & Remove
  const onAdd = useCallback(
    async (isDirectory: boolean, ext: string) => {
      const _fileTree = structuredClone(fileTree) as TNodeTreeData;

      // validate `focusedItem`
      let node = _fileTree[focusedItem];
      if (!node) return;
      if (node.isEntity) {
        node = _fileTree[node.parentUid as TNodeUid];
      }

      // expand the path to `focusedItem`
      node.uid !== RootNodeUid &&
        !expandedItemsObj[node.uid] &&
        dispatch(expandFileTreeNodes([node.uid]));

      // add tmp node
      const tmpNode: TNode = {
        uid: _path.join(node.uid, TmpFileNodeUidWhenAddNew),
        parentUid: node.uid,
        displayName: isDirectory
          ? "Untitled"
          : ext === "html"
          ? "Untitled"
          : "Untitled",
        isEntity: !isDirectory,
        children: [],
        data: {
          valid: false,
          ext,
        },
      };
      node.children.unshift(tmpNode.uid);
      _fileTree[tmpNode.uid] = tmpNode;
      dispatch(setFileTree(_fileTree as TFileNodeTreeData));
    },
    [fileTree, focusedItem, expandedItemsObj],
  );
  const onRemove = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;

    const message = `Are you sure you want to delete them? This action cannot be undone!`;
    if (!window.confirm(message)) {
      return;
    }

    dispatch(setDoingFileAction(true));
    addInvalidNodes(...uids);
    await callFileApi(
      {
        projectContext: project.context,
        action: "remove",
        fileTree,
        fileHandlers,
        uids,
      },
      () => {
        LogAllow && console.error("error while removing file system");
      },
      (allDone: boolean) => {
        LogAllow &&
          console.log(
            allDone ? "all is successfully removed" : "some is not removed",
          );
      },
    );
    removeInvalidNodes(...uids);
    dispatch(setDoingFileAction(false));

    // reload the current project
    setReloadCurrentProjectTrigger(true);
  }, [
    selectedItems,
    invalidNodes,
    addInvalidNodes,
    removeInvalidNodes,
    project,
    fileTree,
    fileHandlers,
  ]);

  // Cut & Copy & Paste & Duplicate
  const onCut = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidNodes[uid]);
    if (uids.length === 0) return;

    /* await callFileApi(
      {
        projectContext: project.context,
        dispatch,
        action: "cut",
        fileTree,
        currentFileUid,
        uids,
        nodeTree,
      },
      () => {
        LogAllow && console.error("error while cutting file system");
      },
    ); */
  }, [selectedItems, fileTree[currentFileUid], nodeTree]);
  const onCopy = useCallback(() => {}, []);
  const onPaste = useCallback(() => {}, []);
  const onDuplicate = useCallback(async () => {
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
        /* const result = await duplicateNode(
          uid,
          true,
          fileTree,
          fileHandlers,
          () => {},
          addInvalidNodes,
          invalidNodes,
        );
        if (result) {
          _uids.push(result);
          _targetUids.push(fileTree[uid].parentUid as TNodeUid);
        } else {
          allDone = false;
        } */
      }),
    );

    if (!allDone) {
      // addMessage(duplicatingWarning);
    }

    /* const action: TFileAction = {
      type: "copy",
      param1: _uids,
      param2: _targetUids,
    };
    dispatch(setFileAction(action)); */

    removeRunningActions(["fileTreeView-duplicate"]);
  }, [
    addRunningActions,
    removeRunningActions,
    project.context,
    invalidNodes,
    addInvalidNodes,
    selectedItems,
    fileTree,
    fileHandlers,
  ]);

  // cb
  const cb_startRenamingNode = useCallback(
    (uid: TNodeUid) => {
      // validate
      if (invalidNodes[uid]) {
        removeInvalidNodes(uid);
        return;
      }
      addInvalidNodes(uid);
    },
    [invalidNodes, addInvalidNodes, removeInvalidNodes],
  );
  const cb_abortRenamingNode = useCallback(
    (item: TreeItem) => {
      const node = item.data as TNode;
      const nodeData = node.data as TFileNodeData;
      if (!nodeData.valid) {
        // remove newly added node
        const _fileTree = structuredClone(fileTree);
        _fileTree[node.parentUid as TNodeUid].children = _fileTree[
          node.parentUid as TNodeUid
        ].children.filter((c_uid) => c_uid !== node.uid);
        delete _fileTree[item.data.uid];
        dispatch(setFileTree(_fileTree));
      }
      removeInvalidNodes(node.uid);
    },
    [fileTree, removeInvalidNodes],
  );
  const cb_renameNode = useCallback(
    async (item: TreeItem, newName: string) => {
      const node = item.data as TNode;
      const nodeData = node.data as TFileNodeData;

      if (nodeData.valid) {
        // rename a file/directory
        const file = fileTree[node.uid];
        if (!file) return;
        const fileData = file.data;
        if (fileData.changed && !confirmAlert(FileChangeAlertMessage)) return;
        const parentNode = fileTree[node.parentUid as TNodeUid];
        if (!parentNode) return;
        const parentNodeData = parentNode.data;
        const name = node.isEntity ? `${newName}.${nodeData.ext}` : newName;
        const path = _path.join(parentNodeData.path, name);

        dispatch(setDoingFileAction(true));
        addInvalidNodes(node.uid);
        await callFileApi(
          {
            projectContext: project.context,
            action: "rename",
            fileTree,
            fileHandlers,
            uids: [node.uid],
            parentUid: node.parentUid as TNodeUid,
            name,
          },
          () => {
            LogAllow && console.error("error while renaming file system");
          },
          (done: boolean) => {
            LogAllow &&
              console.log(done ? "successfully renamed" : "not renamed");
            // add to event history
            const _fileAction: TFileAction = {
              action: "rename",
              payload: { orgPath: nodeData.path, newPath: path },
            };
            dispatch(setFileAction(_fileAction));
          },
        );
        removeInvalidNodes(node.uid);
        dispatch(setDoingFileAction(false));
      } else {
        // create a new file/directory
        const parentNode = fileTree[node.parentUid as TNodeUid];
        if (!parentNode) return;
        const parentNodeData = parentNode.data;
        const name = node.isEntity ? `${newName}.${nodeData.ext}` : newName;
        const path = _path.join(parentNodeData.path, name);

        dispatch(setDoingFileAction(true));
        addInvalidNodes(node.uid);
        await callFileApi(
          {
            projectContext: project.context,
            action: "create",
            fileTree,
            fileHandlers,
            parentUid: node.parentUid as TNodeUid,
            name,
            kind: node.isEntity ? "file" : "directory",
          },
          () => {
            LogAllow && console.error("error while creating file system");
          },
          (done: boolean) => {
            LogAllow &&
              console.log(done ? "successfully created" : "not created");
            // add to event history
            const _fileAction: TFileAction = {
              action: "create",
              payload: { path },
            };
            dispatch(setFileAction(_fileAction));
          },
        );
        removeInvalidNodes(node.uid);
        dispatch(setDoingFileAction(false));
      }

      // reload the current project
      setReloadCurrentProjectTrigger(true);
    },
    [addInvalidNodes, removeInvalidNodes, fileTree, fileHandlers, osType],
  );
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
  const cb_moveNode = useCallback(
    async (uids: string[], targetUid: TNodeUid, copy: boolean = false) => {
      // validate
      const targetNode = fileTree[targetUid];
      if (targetNode === undefined) {
        return;
      }
      const validatedUids = getValidNodeUids(fileTree, uids, targetUid);
      if (validatedUids.length === 0) {
        return;
      }
      // confirm files changes
      const hasChangedFile = validatedUids.some((uid) => {
        const _file = fileTree[uid];
        const _fileData = _file.data as TFileNodeData;
        return _file && _fileData.changed;
      });
      if (hasChangedFile && !confirmAlert(FileChangeAlertMessage)) return;
      addRunningActions(["fileTreeView-move"]);
      addInvalidNodes(...validatedUids);
      await callFileApi(
        {
          projectContext: project.context,
          action: "move",
          fileHandlers,
          uids,
          fileTree,
          targetNode,
          clipboardData,
        },
        () => {
          LogAllow && console.error("error while pasting file system");
        },
        (allDone: boolean) => {
          reloadCurrentProject();
          LogAllow &&
            console.log(
              allDone ? "all is successfully past" : "some is not past",
            );
        },
      );

      /* if (_uids.some((result) => !result)) {
      // addMessage(movingError);
    } */

      /* const action: TFileAction = {
      type: copy ? "copy" : "cut",
      // param1: _uids,
      // param2: _uids.map(() => targetUid),
    };
    dispatch(setFileAction(action)); */

      removeRunningActions(["fileTreeView-move"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      invalidNodes,
      addInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );

  return {
    onAdd,
    onRemove,

    onCut,
    onCopy,
    onPaste,
    onDuplicate,

    cb_startRenamingNode,
    cb_abortRenamingNode,
    cb_renameNode,
    cb_readNode,
    cb_moveNode,
  };
};
