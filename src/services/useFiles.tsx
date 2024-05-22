import { useAppState } from "@_redux/useAppState";
import {
  IcopyFiles,
  IcreateFile,
  IcreateFolder,
  IcutFiles,
  IgetFolderTree,
  IpasteFiles,
  Iredo,
  Iremove,
  IsetCurrentFile,
  IsetCurrentFileContent,
  Iundo,
  Imove,
  IrenameFiles,
} from "@_types/files.types";
import { useDispatch } from "react-redux";
import { verifyFileHandlerPermission } from "./main";
import { setClipboardData } from "@_redux/main/processor";
import {
  _createIDBDirectory,
  _path,
  _writeIDBFile,
  confirmAlert,
  moveIDBSingleDirectoryOrFile,
  moveLocalSingleDirectoryOrFile,
  removeSingleIDBDirectoryOrFile,
  removeSingleLocalDirectoryOrFile,
} from "@_node/index";

import { useCallback, useContext } from "react";
import { MainContext } from "@_redux/main";
import { getObjKeys } from "@_pages/main/helper";
import { useFileHelpers } from "./useFileHelpers";
import { useHandlers } from "@_pages/main/hooks";
import { FileChangeAlertMessage } from "@_constants/main";
import { toast } from "react-toastify";
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
  } = useAppState();
  const { getParentHandler, getUniqueIndexedName, updatedFileTreeAfterAdding } =
    useFileHelpers();
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
      const parentHandler = getParentHandler(fFocusedItem);
      if (!parentHandler) return false;
      if (!(await verifyFileHandlerPermission(parentHandler))) return false;

      //We generate a unique indexed name for the file
      const uniqueIndexedName = await getUniqueIndexedName({
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
          const parentNodeData = fileTree[fFocusedItem].data;
          await _writeIDBFile(
            _path.join(parentNodeData.path, uniqueIndexedName),
            "",
          );
        }
      } catch (err) {
        toast.error("An error occurred while creating the file");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
    },
    [
      fFocusedItem,
      fileTree,
      fileHandlers,
      fSelectedItemsObj,
      fExpandedItemsObj,
    ],
  );
  const createFolder = useCallback(
    async (params: IcreateFolder = {}): Promise<string | null> => {
      //We run this function recursively to create a file with a unique name
      const { entityName = "untitled" } = params;

      //we check if the parent directory has permission to create a directory
      const parentHandler = getParentHandler(fFocusedItem);
      if (!parentHandler) return null;
      if (!(await verifyFileHandlerPermission(parentHandler))) return null;

      //We generate a unique indexed name for the file
      const uniqueIndexedName = await getUniqueIndexedName({
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
          const parentNodeData = fileTree[fFocusedItem].data;
          _createIDBDirectory(
            _path.join(parentNodeData.path, uniqueIndexedName),
          );
        }
      } catch (err) {
        toast.error("An error occurred while creating the folder");
        console.error(err);
      } finally {
        await reloadCurrentProject();
      }
      return uniqueIndexedName;
    },
    [
      fFocusedItem,
      fileTree,
      fileHandlers,
      fSelectedItemsObj,
      fExpandedItemsObj,
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

      await moveLocalSingleDirectoryOrFile({
        fileTree,
        fileHandlers,
        uid,
        targetUid: parentNode.uid,
        isCopy: false,
        newName: name,
      });
      await reloadCurrentProject();
    },
    [fileTree],
  );
  const undo = (params: Iundo) => {
    const { steps = 1 } = params;
    if (steps < 1) return;
    dispatch({ type: "UNDO", payload: steps });
  };
  const redo = (params: Iredo) => {
    const { steps = 1 } = params;
    if (steps < 1) return;
    dispatch({ type: "REDO", payload: steps });
  };

  const paste = async (params: IpasteFiles = {}) => {
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

    /*if the targetUid is not provided, 
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

    try {
      await Promise.all(
        /* we are using map instead of forEach because we want to to get the array of all the promises */
        uidsToPaste.map(async (uid) => {
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
              targetUid: _targetUid,
              isCopy,
              newName: fileTree[uid].data.name,
            });
          }
        }),
      );
    } catch (err) {
      toast.error("An error occurred while pasting the file");
      console.error(err);
    }
    await reloadCurrentProject();
  };
  const move = async (params: Imove) => {
    const { targetUid, uids } = params;
    dispatch({ type: "MOVE_FILES", payload: { uids, targetUid } });
    try {
      await cutFiles({ uids });
      paste({ targetUid, deleteSource: true });
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

    await dispatch({ type: "REMOVE_FILES", payload: _uids });
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
      await reloadCurrentProject();
    } catch (err) {
      toast.error("An error occurred while deleting the file");
      console.error(err);
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
