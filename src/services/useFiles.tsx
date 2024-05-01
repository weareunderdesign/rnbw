import { useAppState } from "@_redux/useAppState";
import {
  IcreateFile,
  IcreateFolder,
  IgetFolderTree,
  Iredo,
  Iremove,
  IsetCurrentFile,
  IsetCurrentFileContent,
  Iundo,
} from "@_types/files.types";
import { useDispatch } from "react-redux";
import { verifyFileHandlerPermission } from "./main";

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
  const copySelectedFiles = () => {};
  const cutSelectedFiles = () => {};

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
  const paste = () => {};
  const move = () => {};

  //Delete
  const remove = (params: Iremove) => {
    const { uids } = params;
    dispatch({ type: "REMOVE_FILES", payload: uids });
  };

  return {
    createFile,
    createFolder,
    getRootTree,
    getFolderTree,
    getCurrentFile,
    copySelectedFiles,
    cutSelectedFiles,
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
