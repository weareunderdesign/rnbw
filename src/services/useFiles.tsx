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
} from "@_types/files.types";
import { useDispatch } from "react-redux";
import { verifyFileHandlerPermission } from "./main";
import { setClipboardData } from "@_redux/main/processor";
import {
  moveLocalSingleDirectoryOrFile,
  removeSingleLocalDirectoryOrFile,
} from "@_node/index";

export default function useFiles() {
  const dispatch = useDispatch();
  const { fFocusedItem, fileTree, fileHandlers, fSelectedItemsObj } =
    useAppState();

  //utilities
  const getParentHandler = (uid: string): FileSystemDirectoryHandle | null => {
    const parentUid = fileTree[uid].parentUid;
    if (!parentUid) return null;
    const parentNode = fileTree[parentUid];
    if (!parentNode) return null;
    const parentHandler = fileHandlers[parentUid] as FileSystemDirectoryHandle;
    return parentHandler;
  };

  //Create
  const createFile = async (params: IcreateFile) => {
    const { name = "untitled", extension = "html" } = params;
    const parentHandler = getParentHandler(fFocusedItem);
    if (!parentHandler) return false;
    if (!(await verifyFileHandlerPermission(parentHandler))) return false;
    const nameWithExtension = `${name}.${extension}`;
    try {
      await parentHandler.getFileHandle(nameWithExtension, { create: true });
      return true;
    } catch (err) {
      return false;
    }
  };
  const createFolder = async (params: IcreateFolder) => {
    const { name = "untitled" } = params;
    const parentHandler = getParentHandler(fFocusedItem);
    if (!parentHandler) return false;
    if (!(await verifyFileHandlerPermission(parentHandler))) return false;
    try {
      await parentHandler.getDirectoryHandle(name, { create: true });
      return true;
    } catch (err) {
      return false;
    }
  };

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
  const copyFiles = (params: IcopyFiles) => {
    const { uids } = params;
    dispatch(
      setClipboardData({
        panel: "file",
        type: "copy",
        uids,
      }),
    );
  };
  const cutFiles = (params: IcutFiles) => {
    const { uids } = params;
    dispatch(
      setClipboardData({
        panel: "file",
        type: "cut",
        uids,
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
  const rename = () => {};
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
  const paste = async (params: IpasteFiles) => {
    const { uids, targetUid, deleteSource } = params;

    await Promise.all(
      /* we are using map instead of forEach because we want to to get the array of all the promises */
      uids.map(async (uid) => {
        await moveLocalSingleDirectoryOrFile({
          fileTree,
          fileHandlers,
          uid,
          targetUid,
          isCopy: deleteSource,
        });
      }),
    );
  };
  const move = (params: Imove) => {
    const { targetUid, uids } = params;
    dispatch({ type: "MOVE_FILES", payload: { uids, targetUid } });
    try {
      cutFiles({ uids });
      paste({ uids, targetUid, deleteSource: true });
    } catch (err) {
      console.error(err);
    }
  };

  //Delete
  const remove = (params: Iremove) => {
    const { uids } = params;
    dispatch({ type: "REMOVE_FILES", payload: uids });
    try {
      Promise.all(
        uids.map(async (uid) => {
          return removeSingleLocalDirectoryOrFile({
            fileTree,
            fileHandlers,
            uid,
          });
        }),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return {
    createFile,
    createFolder,
    getRootTree,
    getFolderTree,
    getCurrentFile,
    copySelectedFiles: copyFiles,
    cutSelectedFiles: cutFiles,
    getSelectedFiles,
    setCurrentFile,
    setCurrentFileContent,
    rename,
    undo,
    redo,
    paste,
    move,
    remove,
  };
}
