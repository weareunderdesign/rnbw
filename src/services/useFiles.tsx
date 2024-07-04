import { useAppState } from "@_redux/useAppState";
import {
  IcopyFiles,
  IcreateFile,
  IcreateFolder,
  IcutFiles,
  IgetFolderTree,
  IpasteFiles,
  Iremove,
  IsetCurrentFile,
  IsetCurrentFileContent,
  Imove,
  IrenameFiles,
} from "@_types/files.types";
import { useDispatch } from "react-redux";
import { verifyFileHandlerPermission } from "../rnbw";
import {
  setClipboardData,
  setDidRedo,
  setDidUndo,
} from "@_redux/main/processor";
import {
  FileSystemApis,
  TFileNodeData,
  _createIDBDirectory,
  _path,
  _writeIDBFile,
  confirmAlert,
  generateNewNameForIDBDirectoryOrFile,
  getTargetHandler,
  moveIDBSingleDirectoryOrFile,
  removeSingleIDBDirectoryOrFile,
  removeSingleLocalDirectoryOrFile,
} from "@_api/index";

import { useCallback, useContext } from "react";
import { MainContext } from "@_redux/main";
import { getObjKeys } from "@src/helper";
import { useFileHelpers } from "./useFileHelpers";
import { useHandlers } from "@src/hooks";
import { FileChangeAlertMessage } from "@src/rnbwTSX";
import { toast } from "react-toastify";
import {
  FileTree_Event_RedoActionType,
  FileTree_Event_UndoActionType,
  TFileAction,
  setFileAction,
  setLastFileAction,
} from "@_redux/main/fileTree";
import { LogAllow } from "@src/rnbwTSX";
export default function useFiles() {
  const dispatch = useDispatch();
  const {
    fFocusedItem,
    fileTree,
    fileHandlers,
    fSelectedItemsObj,
    fExpandedItemsObj,
    invalidFileNodes,
    clipboardData,
    project,
    fileAction,
    fileEventPastLength,
    fileEventFutureLength,
    didUndo,
    didRedo,
  } = useAppState();
  const {
    getParentHandler,
    getUniqueIndexedName,
    updatedFileTreeAfterAdding,
    moveLocalSingleDirectoryOrFile,
  } = useFileHelpers();

  const { monacoEditorRef } = useContext(MainContext);
  const { reloadCurrentProject } = useHandlers();

  //Create
  const createFile = useCallback(
    async (
      params: IcreateFile = {
        entityName: "untitled",
        extension: "html",
      },
    ) => {
      //We run this function recursively to create a file with a unique name
      const { entityName = "untitled", extension = "html" } = params;

      //we check if the parent directory has permission to create a file
      const parentHandler = getParentHandler(
        fFocusedItem,
      ) as FileSystemDirectoryHandle;

      if (
        project.context === "local" &&
        !parentHandler &&
        !(await verifyFileHandlerPermission(parentHandler))
      )
        return false;

      const focusedFileNode = fFocusedItem || "ROOT";
      const parentUid = fileTree[focusedFileNode]?.parentUid || "ROOT";

      if (!parentUid) return null;

      const nodeData: TFileNodeData = {
        ...fileTree[focusedFileNode]?.data,
        name: entityName,
        ext: extension,
        kind: "file",
      };

      //We generate a unique indexed name for the file
      const uniqueIndexedName =
        project.context === "idb"
          ? await generateNewNameForIDBDirectoryOrFile({
              nodeData,
              targetNodeData: fileTree[parentUid].data,
            })
          : await getUniqueIndexedName({
              parentHandler,
              entityName,
              extension,
            });

      try {
        //getFileHandle throws an error if the file does not exist
        if (project.context === "local") {
          await parentHandler.getFileHandle(uniqueIndexedName, {
            create: true,
          });
        } else {
          const parentNodePath = fileTree[parentUid].data.path;
          await _writeIDBFile(
            _path.join(parentNodePath, uniqueIndexedName),
            "",
          );
        }
        const _fileAction: TFileAction = {
          action: "create",
          payload: { uids: [_path.join(parentUid, uniqueIndexedName)] },
        };
        !didUndo && !didRedo && dispatch(setFileAction(_fileAction));
      } catch (err) {
        toast.error("An error occurred while creating the file");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
    },
    [
      didUndo,
      didRedo,
      fFocusedItem,
      fileTree,
      fileHandlers,
      fSelectedItemsObj,
      fExpandedItemsObj,
      project,
    ],
  );
  const createFolder = useCallback(
    async (params: IcreateFolder = {}): Promise<string | null> => {
      //We run this function recursively to create a file with a unique name
      const { entityName = "untitled" } = params;

      //we check if the parent directory has permission to create a directory
      const parentHandler = getParentHandler(
        fFocusedItem,
      ) as FileSystemDirectoryHandle;

      if (
        project.context === "local" &&
        !parentHandler &&
        !(await verifyFileHandlerPermission(parentHandler))
      )
        return null;

      const parentUid = fileTree?.[fFocusedItem]?.parentUid;
      if (!parentUid) return null;

      const nodeData: TFileNodeData = {
        ...fileTree[fFocusedItem].data,
        name: entityName,
        ext: "",
        kind: "directory",
      };
      //We generate a unique indexed name for the file
      const uniqueIndexedName =
        project.context === "idb"
          ? await generateNewNameForIDBDirectoryOrFile({
              nodeData,
              targetNodeData: fileTree?.[parentUid]?.data,
            })
          : await getUniqueIndexedName({
              parentHandler,
              entityName,
            });

      try {
        //getDirectoryHandle throws an error if the folder does not exist
        if (project.context === "local") {
          await parentHandler.getDirectoryHandle(uniqueIndexedName, {
            create: true,
          });
        } else {
          const parentNodePath = fileTree[parentUid].data.path;
          _createIDBDirectory(_path.join(parentNodePath, uniqueIndexedName));
        }
        const _fileAction: TFileAction = {
          action: "create",
          payload: {
            uids: [_path.join(parentUid, uniqueIndexedName)],
          },
        };
        !didUndo && !didRedo && dispatch(setFileAction(_fileAction));
      } catch (err) {
        toast.error("An error occurred while creating the folder");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
      return uniqueIndexedName;
    },
    [
      didUndo,
      didRedo,
      fFocusedItem,
      fileTree,
      fileHandlers,
      fSelectedItemsObj,
      fExpandedItemsObj,
      project,
    ],
  );

  //Read
  const getRootTree = () => {
    return fileTree;
  };
  const getFolderTree = (params: IgetFolderTree) => {
    const { uid } = params;
    return fileTree[uid];
  };
  const getCurrentFile = () => {
    return fileTree[fFocusedItem].data.content;
  };
  const getSelectedFiles = () => {
    return fSelectedItemsObj;
  };
  const getEditorRef = () => {
    return monacoEditorRef;
  };
  const copyFiles = (params: IcopyFiles = {}) => {
    const { uids } = params;
    const selectedItems = getObjKeys(fSelectedItemsObj);
    const selectedUids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    const _uids = uids || selectedUids;
    if (_uids.length === 0) return;
    dispatch(
      setClipboardData({
        panel: "file",
        type: "copy",
        uids: _uids,
      }),
    );
  };
  const cutFiles = async (params: IcutFiles = {}) => {
    const { uids } = params;
    const selectedItems = getObjKeys(fSelectedItemsObj);
    const selectedUids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    const _uids = uids || selectedUids;
    if (_uids.length === 0) return;

    await dispatch(
      setClipboardData({
        panel: "file",
        type: "cut",
        uids: _uids,
      }),
    );
  };

  //Update
  const setCurrentFile = (params: IsetCurrentFile) => {
    const { uid } = params;
    dispatch({ type: "SET_FOCUSED_ITEM", payload: uid });
  };
  const setCurrentFileContent = (params: IsetCurrentFileContent) => {
    const { content } = params;
    const uid = fFocusedItem;
    dispatch({
      type: "UPDATE_FILE_CONTENT",
      payload: { uid, content },
    });
  };
  const rename = useCallback(
    async (params: IrenameFiles) => {
      const { uid, newName, extension } = params;
      // rename a file/directory
      const file = fileTree[uid];

      if (!file) return;
      const fileData = file.data;
      if (fileData.changed && !confirmAlert(FileChangeAlertMessage)) return;

      const parentNode = fileTree[file.parentUid!];
      if (!parentNode) return;
      const name = `${newName}${extension ? `.${extension}` : ""}`;
      try {
        if (project.context === "local") {
          await moveLocalSingleDirectoryOrFile({
            fileTree,
            fileHandlers,
            uid,
            targetUid: parentNode.uid,
            isCopy: false,
            newName: name,
          });
        } else {
          await moveIDBSingleDirectoryOrFile({
            fileTree,
            uid,
            targetUid: parentNode.uid,
            isCopy: false,
            newName: name,
          });
        }

        const _fileAction: TFileAction = {
          action: "rename",
          payload: {
            orgUid: uid,
            newUid: _path.join(parentNode.uid, name),
          },
        };

        !didUndo && !didRedo && dispatch(setFileAction(_fileAction));
      } catch (err) {
        toast.error("An error occurred while renaming");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
    },
    [fileTree, didUndo, didRedo, project, fileHandlers],
  );
  const undo = useCallback(async () => {
    if (fileEventPastLength === 0) {
      LogAllow && console.log("Undo - FileTree - it is the origin state");
      return;
    }

    dispatch(setLastFileAction({ ...fileAction }));
    dispatch({ type: FileTree_Event_UndoActionType });
    dispatch(setDidUndo(true));
  }, [fileEventPastLength, fileAction]);

  const redo = useCallback(async () => {
    if (fileEventFutureLength === 0) {
      LogAllow && console.log("Redo - FileTree - it is the latest state");
      return;
    }
    dispatch({ type: FileTree_Event_RedoActionType });
    dispatch(setDidRedo(true));
  }, [fileEventFutureLength]);

  const paste = useCallback(
    async (params: IpasteFiles = {}) => {
      const { uids, targetUid, deleteSource } = params;

      //deleteSource is true if the files are cut
      const isCopy = !deleteSource && clipboardData?.type === "copy";

      //checking if the paste operation is on files and something is copied
      if (!uids && (!clipboardData || clipboardData.panel !== "file")) return;
      const copiedUids = clipboardData
        ? clipboardData.uids.filter((uid) => !invalidFileNodes[uid])
        : [];

      const uidsToPaste = uids || copiedUids;

      if (uidsToPaste.length === 0) return;

      /*  if the targetUid is not provided, 
          we paste the files in the focused directory */

      const _targetUid = targetUid || fFocusedItem;
      const targetNode = fileTree[_targetUid];

      if (!targetNode) return;

      //preventing pasting into itself
      if (!targetNode.isEntity) {
        if (uidsToPaste.some((uid) => targetNode.uid.includes(uid))) {
          alert("You cannot paste a file in itself");
          return;
        }
      }

      const newNames: string[] = await Promise.all(
        uidsToPaste.map(
          async (uid) =>
            await FileSystemApis[project.context].generateNewName({
              nodeData: fileTree[uid]?.data,
              // for `local` project
              targetHandler: getTargetHandler({
                targetUid: _targetUid,
                fileTree,
                fileHandlers,
              }),
              // for `idb` project
              targetNodeData:
                targetNode.data.kind === "directory"
                  ? targetNode.data
                  : fileTree[targetNode.parentUid!].data,
            }),
        ),
      );
      try {
        await Promise.all(
          /* we are using map instead of forEach because we want to to get the array of all the promises */
          uidsToPaste.map(async (uid, index) => {
            if (project.context === "local") {
              await moveLocalSingleDirectoryOrFile({
                fileTree,
                fileHandlers,
                uid,
                targetUid: _targetUid,
                isCopy,
              });
            } else {
              await moveIDBSingleDirectoryOrFile({
                fileTree,
                uid,
                targetUid:
                  targetNode.data.kind === "directory"
                    ? _targetUid
                    : targetNode.parentUid!,
                isCopy,
                newName: newNames[index],
              });
            }
          }),
        );

        const _fileAction: TFileAction = {
          action: "move",
          payload: {
            uids: uidsToPaste.map((uid, index) => ({
              orgUid: uid,
              newUid: _path.join(
                targetNode.isEntity ? targetNode.parentUid : targetNode.uid,
                newNames[index],
              ),
            })),
            isCopy,
          },
        };

        !didUndo && !didRedo && dispatch(setFileAction(_fileAction));
      } catch (err) {
        toast.error("An error occurred while pasting the file");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
    },
    [
      didUndo,
      didRedo,
      clipboardData,
      invalidFileNodes,
      fFocusedItem,
      project,
      fileTree,
      fileHandlers,
    ],
  );

  const move = async (params: Imove) => {
    const { targetUid, uids } = params;
    try {
      paste({ uids, targetUid, deleteSource: true });
    } catch (err) {
      toast.error("An error occurred while moving the file");
      console.error(err);
    }
  };

  //Delete
  const remove = async (params: Iremove = {}) => {
    const { uids } = params;
    const selectedItems = getObjKeys(fSelectedItemsObj);
    const selectedUids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    const _uids = uids || selectedUids;
    if (_uids.length === 0) return;

    const message = `Are you sure you want to delete them? This action cannot be undone!`;
    if (!window.confirm(message)) {
      return;
    }

    try {
      await Promise.all(
        _uids.map(async (uid) => {
          if (project.context === "local") {
            return removeSingleLocalDirectoryOrFile({
              fileTree,
              fileHandlers,
              uid,
            });
          } else {
            return removeSingleIDBDirectoryOrFile({
              uid,
              fileTree,
            });
          }
        }),
      );
      const _fileAction: TFileAction = {
        action: "remove",
        payload: { uids: _uids },
      };
      !didUndo && !didRedo && dispatch(setFileAction(_fileAction));
    } catch (err) {
      toast.error("An error occurred while deleting the file");
      console.error(err);
    } finally {
      await reloadCurrentProject();
    }
  };

  return {
    createFile,
    createFolder,
    getRootTree,
    getFolderTree,
    getCurrentFile,
    getEditorRef,
    copyFiles,
    cutFiles,
    getSelectedFiles,
    setCurrentFile,
    setCurrentFileContent,
    rename,
    undo,
    redo,
    paste,
    move,
    remove,
    updatedFileTreeAfterAdding,
  };
}
