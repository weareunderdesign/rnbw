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
  TFileNodeTreeData,
  TNode,
  TNodeTreeData,
  _path,
  moveLocalSingleDirectoryOrFile,
  removeSingleLocalDirectoryOrFile,
} from "@_node/index";
import { RootNodeUid, TmpFileNodeUidWhenAddNew } from "@_constants/main";
import { expandFileTreeNodes, setFileTree } from "@_redux/main/fileTree";
import { useCallback, useContext } from "react";
import { MainContext } from "@_redux/main";

export default function useFiles() {
  const dispatch = useDispatch();
  const {
    fFocusedItem,
    fileTree,
    fileHandlers,
    fSelectedItemsObj,
    fExpandedItemsObj,
  } = useAppState();
  const { triggerCurrentProjectReload } = useContext(MainContext);

  //utilities
  const getParentHandler = (uid: string): FileSystemDirectoryHandle | null => {
    if (!uid) return fileHandlers[RootNodeUid] as FileSystemDirectoryHandle;
    const parentUid = fileTree[uid].parentUid;
    if (!parentUid) return null;
    const parentNode = fileTree[parentUid];
    if (!parentNode) return null;
    const parentHandler = fileHandlers[parentUid] as FileSystemDirectoryHandle;
    return parentHandler;
  };

  const updatedFileTreeAfterAdding = ({
    isFolder,
    ext,
  }: {
    isFolder: boolean;
    ext: string;
  }) => {
    // performs a deep clone of the file tree
    const _fileTree = structuredClone(fileTree) as TNodeTreeData;

    // find the immediate directory of the focused item if it is a file
    let immediateDir = _fileTree[fFocusedItem];
    if (!immediateDir) return;
    if (immediateDir.isEntity) {
      immediateDir = _fileTree[immediateDir.parentUid!];
    }

    //if the directory is not a RootNode and not already expanded, expand it
    if (
      immediateDir.uid !== RootNodeUid &&
      !fExpandedItemsObj[immediateDir.uid]
    ) {
      dispatch(expandFileTreeNodes([immediateDir.uid]));
    }

    // create tmp node for new file/directory
    const tmpNode: TNode = {
      uid: _path.join(immediateDir.uid, TmpFileNodeUidWhenAddNew),
      parentUid: immediateDir.uid,
      displayName: "Untitled",
      isEntity: !isFolder,
      children: [],
      data: {
        valid: false,
        ext,
      },
    };

    // adds the tmp node to the file tree at the beginning of focused item parent's children
    immediateDir.children.unshift(tmpNode.uid);

    // Assign the tmp node to the file tree
    _fileTree[tmpNode.uid] = tmpNode;

    // update the file tree
    dispatch(setFileTree(_fileTree as TFileNodeTreeData));
  };

  //Create
  const createFile = useCallback(
    async (
      params: IcreateFile = {
        name: "untitled",
        extension: "html",
      },
    ) => {
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
      } finally {
        triggerCurrentProjectReload();
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
  const createFolder = async (params: IcreateFolder = {}) => {
    const { name = "untitled" } = params;
    const parentHandler = getParentHandler(fFocusedItem);
    if (!parentHandler) return false;
    if (!(await verifyFileHandlerPermission(parentHandler))) return false;
    try {
      await parentHandler.getDirectoryHandle(name, { create: true });
      return true;
    } catch (err) {
      return false;
    } finally {
      triggerCurrentProjectReload();
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
    updatedFileTreeAfterAdding,
  };
}
