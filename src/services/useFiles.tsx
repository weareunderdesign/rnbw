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
import { getObjKeys } from "@_pages/main/helper";

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
  } = useAppState();
  const { triggerCurrentProjectReload, monacoEditorRef } =
    useContext(MainContext);

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

  const getUniqueIndexedName = async (
    parentHandler: FileSystemDirectoryHandle,
    name: string,
    extension?: string,
  ) => {
    let index = 0;

    function getIndexedName() {
      /*if the extension is provided, then it is a file, 
      else it is a folder*/

      if (extension)
        return `${name}${index > 0 ? `(${index})` : ""}.${extension}`;
      return `${name}${index > 0 ? `(${index})` : ""}`;
    }

    let uniqueName = null;
    //We generate a unique indexed name for the file
    while (uniqueName === null) {
      const indexedName = getIndexedName();
      try {
        //getFileHandle throws an error if the file does not exist
        if (extension) await parentHandler.getFileHandle(indexedName);
        else await parentHandler.getDirectoryHandle(indexedName);
        index++;
      } catch (err) {
        //if the error is not NotFoundError, we create the file

        //@ts-expect-error - types are not updated
        if (err.name === "NotFoundError") {
          uniqueName = indexedName;
        }
      }
    }
    return uniqueName;
  };

  //Create
  const createFile = useCallback(
    async (
      params: IcreateFile = {
        name: "untitled",
        extension: "html",
      },
    ) => {
      //We run this function recursively to create a file with a unique name
      const { name = "untitled", extension = "html" } = params;

      //we check if the parent directory has permission to create a file
      const parentHandler = getParentHandler(fFocusedItem);
      if (!parentHandler) return false;
      if (!(await verifyFileHandlerPermission(parentHandler))) return false;

      //We generate a unique indexed name for the file
      const uniqueIndexedName = await getUniqueIndexedName(
        parentHandler,
        name,
        extension,
      );

      try {
        //getFileHandle throws an error if the file does not exist
        await parentHandler.getFileHandle(uniqueIndexedName, {
          create: true,
        });
      } catch (err) {
        console.error(err);
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
  const createFolder = useCallback(
    async (params: IcreateFolder = {}) => {
      //We run this function recursively to create a file with a unique name
      const { name = "untitled" } = params;

      //we check if the parent directory has permission to create a directory
      const parentHandler = getParentHandler(fFocusedItem);
      if (!parentHandler) return false;
      if (!(await verifyFileHandlerPermission(parentHandler))) return;

      //We generate a unique indexed name for the file
      const uniqueIndexedName = await getUniqueIndexedName(parentHandler, name);

      try {
        //getDirectoryHandle throws an error if the folder does not exist
        await parentHandler.getDirectoryHandle(uniqueIndexedName, {
          create: true,
        });
      } catch (err) {
        console.error(err);
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
  const cutFiles = (params: IcutFiles = {}) => {
    const { uids } = params;
    const selectedItems = getObjKeys(fSelectedItemsObj);
    const selectedUids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    const _uids = uids || selectedUids;
    if (_uids.length === 0) return;

    dispatch(
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
  const paste = async (params: IpasteFiles = {}) => {
    const { targetUid, deleteSource } = params;

    const isCopy = deleteSource || clipboardData?.type === "copy";
    if (!clipboardData || clipboardData.panel !== "file") return;
    const copiedUids = clipboardData.uids.filter(
      (uid) => !invalidFileNodes[uid],
    );
    if (copiedUids.length === 0) return;
    const targetNode = fileTree[fFocusedItem];
    if (!targetNode) return;

    const _targetUid = targetUid || fFocusedItem;
    try {
      await Promise.all(
        /* we are using map instead of forEach because we want to to get the array of all the promises */
        copiedUids.map(async (uid) => {
          await moveLocalSingleDirectoryOrFile({
            fileTree,
            fileHandlers,
            uid,
            targetUid: _targetUid,
            isCopy,
          });
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      triggerCurrentProjectReload();
    }
  };
  const move = (params: Imove) => {
    const { targetUid, uids } = params;
    dispatch({ type: "MOVE_FILES", payload: { uids, targetUid } });
    try {
      cutFiles({ uids });
      paste({ targetUid, deleteSource: true });
    } catch (err) {
      console.error(err);
    }
  };

  //Delete
  const remove = (params: Iremove = {}) => {
    const { uids } = params;
    const selectedItems = getObjKeys(fSelectedItemsObj);
    const selectedUids = selectedItems.filter((uid) => !invalidFileNodes[uid]);
    const _uids = uids || selectedUids;
    if (_uids.length === 0) return;

    const message = `Are you sure you want to delete them? This action cannot be undone!`;
    if (!window.confirm(message)) {
      return;
    }

    dispatch({ type: "REMOVE_FILES", payload: _uids });
    try {
      Promise.all(
        _uids.map(async (uid) => {
          return removeSingleLocalDirectoryOrFile({
            fileTree,
            fileHandlers,
            uid,
          });
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      triggerCurrentProjectReload();
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
