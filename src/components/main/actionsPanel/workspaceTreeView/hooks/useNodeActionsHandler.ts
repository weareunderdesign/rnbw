import { useCallback, useContext } from "react";

import { TreeItem } from "react-complex-tree";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import {
  FileChangeAlertMessage,
  RenderableFileTypes,
  RootNodeUid,
  TmpFileNodeUidWhenAddNew,
} from "@_constants/main";
import { FileActions } from "@_node/apis";
import {
  _path,
  confirmAlert,
  FileSystemApis,
  getTargetHandler,
  isUnsavedProject,
  TFileNodeData,
  TFileNodeTreeData,
} from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { clearFileSession } from "@_pages/main/helper";
import { MainContext } from "@_redux/main";
import {
  addInvalidFileNodes,
  expandFileTreeNodes,
  removeInvalidFileNodes,
  setCurrentFileUid,
  setDoingFileAction,
  setFileAction,
  setFileTree,
  setPrevRenderableFileUid,
  TFileAction,
} from "@_redux/main/fileTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import { setClipboardData, setShowCodeView } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const useNodeActionsHandler = () => {
  const dispatch = useDispatch();
  const {
    project,
    currentFileUid,
    fileTree,
    showCodeView,
    fFocusedItem: focusedItem,
    fExpandedItemsObj: expandedItemsObj,
    fSelectedItems: selectedItems,
    clipboardData,
    webComponentOpen,
    htmlReferenceData,
    fileHandlers,
    invalidFileNodes,
  } = useAppState();
  const {
    addRunningActions,
    removeRunningActions,
    triggerCurrentProjectReload,
  } = useContext(MainContext);

  // Add & Remove
  const onAdd = useCallback(
    async (isDirectory: boolean, ext: string) => {
      const _fileTree = structuredClone(fileTree) as TNodeTreeData;

      // validate `focusedItem`
      let node = _fileTree[focusedItem];
      if (!node) return;
      if (node.isEntity) {
        node = _fileTree[node.parentUid!];
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
    const uids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    if (uids.length === 0) return;

    const message = `Are you sure you want to delete them? This action cannot be undone!`;
    if (!window.confirm(message)) {
      return;
    }

    dispatch(setDoingFileAction(true));
    dispatch(addInvalidFileNodes([...uids]));
    await FileActions.remove({
      projectContext: project.context,
      fileTree,
      fileHandlers,
      uids,
      fb: () => {
        LogAllow && console.error("error while removing file system");
      },
      cb: (allDone: boolean | undefined) => {

        LogAllow &&
          console.log(
            allDone ? "all is successfully removed" : "some is not removed",
          );
        // add to event history
        const _fileAction: TFileAction = {
          action: "remove",
          payload: { uids },
        };
        dispatch(setFileAction(_fileAction));
      },
    });
    dispatch(removeInvalidFileNodes([...uids]));
    dispatch(setDoingFileAction(false));

    // reload the current project
    triggerCurrentProjectReload();
  }, [selectedItems, invalidFileNodes, project, fileTree, fileHandlers]);

  // Cut & Copy & Paste & Duplicate
  const onCut = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    if (uids.length === 0) return;
    FileActions.cut({ uids, dispatch });
  }, [selectedItems]);
  const onCopy = useCallback(() => {
    const uids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    if (uids.length === 0) return;
    FileActions.copy({ uids, dispatch });
  }, [selectedItems]);
  const onPaste = useCallback(async () => {
    if (!clipboardData || clipboardData.panel !== "file") return;
    const uids = clipboardData.uids.filter((uid) => !invalidFileNodes[uid]);
    if (uids.length === 0) return;
    const targetNode = fileTree[focusedItem];
    if (!targetNode) return;

    // confirm files changes
    if (
      isUnsavedProject(fileTree, uids) &&
      !confirmAlert(FileChangeAlertMessage)
    )
      return;

    dispatch(setDoingFileAction(true));
    dispatch(addInvalidFileNodes([...uids]));
    const targetUids = uids.map(() =>
      targetNode.isEntity ? targetNode.parentUid! : targetNode.uid,
    );
    const newNames: string[] = await Promise.all(
      uids.map(
        async (uid) =>
          await FileSystemApis[project.context].generateNewName({
            nodeData: fileTree[uid].data,
            // for `local` project
            targetHandler: getTargetHandler({
              targetUid: focusedItem,
              fileTree,
              fileHandlers,
            }),
            // for `idb` project
            targetNodeData: targetNode.data,
          }),
      ),
    );
    const isCopy = clipboardData.type === "copy";
    await FileActions.move({
      projectContext: project.context,
      fileTree,
      fileHandlers,
      uids,
      targetUids,
      newNames,
      isCopy,
      fb: () => {
        LogAllow && console.error("error while pasting file system");
      },
      cb: (allDone: boolean | undefined) => {

        LogAllow &&
          console.log(
            allDone ? "all is successfully pasted" : "some is not pasted",
          );

        // clear clipboard when cut/paste
        !isCopy &&
          dispatch(
            setClipboardData({
              panel: "none",
              type: null,
              uids: [],
            }),
          );

        // add to event history
        const _fileAction: TFileAction = {
          action: "move",
          payload: {
            uids: uids.map((uid, index) => ({
              orgUid: uid,
              newUid: _path.join(targetUids[index], newNames[index]),
            })),
            isCopy,
          },
        };
        dispatch(setFileAction(_fileAction));
      },
    });
    dispatch(removeInvalidFileNodes([...uids]));
    dispatch(setDoingFileAction(false));

    // reload the current project
    triggerCurrentProjectReload();
  }, [clipboardData, fileTree, focusedItem, project, fileHandlers]);
  const onDuplicate = useCallback(async () => {
    const uids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    if (uids.length === 0) return;

    // confirm files changes
    if (
      isUnsavedProject(fileTree, uids) &&
      !confirmAlert(FileChangeAlertMessage)
    )
      return;

    dispatch(setDoingFileAction(true));
    dispatch(addInvalidFileNodes([...uids]));
    const targetUids = uids.map((uid) => fileTree[uid].parentUid!);
    const newNames: string[] = await Promise.all(
      uids.map(async (uid) => {
        const node = fileTree[uid];
        const parentNode = fileTree[node.parentUid!];
        return await FileSystemApis[project.context].generateNewName({
          nodeData: node.data,
          // for `local` project
          targetHandler: fileHandlers[
            parentNode.uid
          ] as FileSystemDirectoryHandle,
          // for `idb` project
          targetNodeData: parentNode.data,
        });
      }),
    );
    const isCopy = true;
    await FileActions.move({
      projectContext: project.context,
      fileTree,
      fileHandlers,
      uids,
      targetUids,
      newNames,
      isCopy,
      fb: () => {
        LogAllow && console.error("error while duplicating file system");
      },
      cb: (allDone: boolean | unknown) => {

        LogAllow &&
          console.log(
            allDone
              ? "all is successfully duplicated"
              : "some is not duplicated",
          );

        // add to event history
        const _fileAction: TFileAction = {
          action: "move",
          payload: {
            uids: uids.map((uid, index) => ({
              orgUid: uid,
              newUid: _path.join(targetUids[index], newNames[index]),
            })),
            isCopy,
          },
        };
        dispatch(setFileAction(_fileAction));
      },
    });
    dispatch(removeInvalidFileNodes([...uids]));
    dispatch(setDoingFileAction(false));

    // reload the current project
    triggerCurrentProjectReload();
  }, [selectedItems, invalidFileNodes, project, fileTree, fileHandlers]);

  // cb
  const cb_startRenamingNode = useCallback(
    (uid: TNodeUid) => {
      // validate
      if (invalidFileNodes[uid]) {
        dispatch(removeInvalidFileNodes([uid]));
        return;
      }
      dispatch(addInvalidFileNodes([uid]));
    },
    [invalidFileNodes],
  );
  const cb_abortRenamingNode = useCallback(
    (item: TreeItem) => {
      const node = item.data as TNode;
      const nodeData = node.data as TFileNodeData;
      if (!nodeData.valid) {
        // remove newly added node
        const _fileTree = structuredClone(fileTree);
        _fileTree[node.parentUid!].children = _fileTree[
          node.parentUid!
        ].children.filter((c_uid) => c_uid !== node.uid);
        delete _fileTree[item.data.uid];
        dispatch(setFileTree(_fileTree));
      }
      dispatch(removeInvalidFileNodes([node.uid]));
    },
    [fileTree],
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

        const parentNode = fileTree[node.parentUid!];
        if (!parentNode) return;
        const name = node.isEntity ? `${newName}.${nodeData.ext}` : newName;
        const newUid = _path.join(parentNode.uid, name);

        dispatch(setDoingFileAction(true));
        dispatch(addInvalidFileNodes([node.uid]));
        await FileActions.rename({
          projectContext: project.context,
          fileTree,
          fileHandlers,
          uids: [node.uid],
          parentUid: node.parentUid!,
          newName: name,
          fb: () => {
            LogAllow && console.error("error while renaming file system");
          },
          cb: (allDone: boolean|undefined) => {
            LogAllow &&
              console.log(allDone ? "successfully renamed" : "not renamed");
            // add to event history
            const _fileAction: TFileAction = {
              action: "rename",
              payload: { orgUid: node.uid, newUid },
            };
            dispatch(setFileAction(_fileAction));
          },
        });
        dispatch(removeInvalidFileNodes([node.uid]));
        dispatch(setDoingFileAction(false));
      } else {
        // create a new file/directory
        const parentNode = fileTree[node.parentUid!];
        if (!parentNode) return;
        const name = node.isEntity ? `${newName}.${nodeData.ext}` : newName;
        const newUid = _path.join(parentNode.uid, name);

        dispatch(setDoingFileAction(true));
        dispatch(addInvalidFileNodes([node.uid]));
        await FileActions.create({
          projectContext: project.context,
          fileTree,
          fileHandlers,
          parentUid: node.parentUid!,
          name,
          kind: node.isEntity ? "file" : "directory",
          fb: () => {
            LogAllow && console.error("error while creating file system");
          },
          cb: (allDone: boolean | undefined) => {
            LogAllow &&
              console.log(allDone ? "successfully created" : "not created");
            // add to event history
            const _fileAction: TFileAction = {
              action: "create",
              payload: { uids: [newUid] },
            };
            dispatch(setFileAction(_fileAction));
          },
        });
        dispatch(removeInvalidFileNodes([node.uid]));
        dispatch(setDoingFileAction(false));
      }

      // reload the current project
      triggerCurrentProjectReload();
    },
    [project, fileTree, fileHandlers],
  );
  const cb_readNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["fileTreeView-read"]);

      // validate
      if (invalidFileNodes[uid]) {
        removeRunningActions(["fileTreeView-read"]);
        return;
      }
      const node = structuredClone(fileTree[uid]);
      if (node === undefined || !node.isEntity || currentFileUid === uid) {
        removeRunningActions(["fileTreeView-read"]);
        return;
      }

      const nodeData = node.data as TFileNodeData;
      if (RenderableFileTypes[nodeData.ext]) {
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
      if (!webComponentOpen) {
        clearFileSession(dispatch);
      }
      dispatch(setCurrentFileUid(uid));
      dispatch(setCurrentFileContent(nodeData.content));

      removeRunningActions(["fileTreeView-read"]);

      showCodeView === false && dispatch(setShowCodeView(true));
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidFileNodes,
      fileTree,
      currentFileUid,
      showCodeView,
      webComponentOpen,
    ],
  );
  const cb_moveNode = useCallback(
    async (uids: string[], targetUid: TNodeUid) => {
      const targetNode = fileTree[targetUid];
      if (!targetNode) return;
      const validatedUids = getValidNodeUids(fileTree, uids, targetUid);
      if (validatedUids.length === 0) return;

      // confirm files changes
      if (
        isUnsavedProject(fileTree, validatedUids) &&
        !confirmAlert(FileChangeAlertMessage)
      )
        return;

      dispatch(setDoingFileAction(true));
      dispatch(addInvalidFileNodes([...validatedUids]));
      const targetUids = validatedUids.map(() => targetUid);
      const newNames: string[] = await Promise.all(
        uids.map(
          async (uid) =>
            await FileSystemApis[project.context].generateNewName({
              nodeData: fileTree[uid].data,
              // for `local` project
              targetHandler: fileHandlers[
                targetUid
              ] as FileSystemDirectoryHandle,
              // for `idb` project
              targetNodeData: targetNode.data,
            }),
        ),
      );
      const isCopy = false;
      await FileActions.move({
        projectContext: project.context,
        fileTree,
        fileHandlers,
        uids,
        targetUids,
        newNames,
        isCopy,
        fb: () => {
          LogAllow && console.error("error while moving file system");
        },
        cb: (allDone: boolean|undefined) => {
          LogAllow &&
            console.log(
              allDone ? "all is successfully moved" : "some is not moved",
            );

          // add to event history
          const _fileAction: TFileAction = {
            action: "move",
            payload: {
              uids: uids.map((uid, index) => ({
                orgUid: uid,
                newUid: _path.join(targetUids[index], newNames[index]),
              })),
              isCopy,
            },
          };
          dispatch(setFileAction(_fileAction));
        },
      });
      dispatch(removeInvalidFileNodes([...uids]));
      dispatch(setDoingFileAction(false));

      // reload the current project
      triggerCurrentProjectReload();
    },
    [project, fileTree, fileHandlers],
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
