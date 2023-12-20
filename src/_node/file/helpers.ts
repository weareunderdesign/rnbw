import { FileChangeAlertMessage, RootNodeUid } from "@_constants/main";

import {
  TFileHandlerInfoObj,
  TFileNodeData,
  TFileNodeTreeData,
  TNodeUid,
  _getIDBDirectoryOrFileStat,
  _path,
  _readIDBFile,
  _removeIDBDirectoryOrFile,
  _writeIDBFile,
} from "../";
import {
  copyDirectory,
  moveDirectory,
} from "@_components/main/actionsPanel/workspaceTreeView/helpers";

export const sortFilesByASC = (handlerObj: TFileHandlerInfoObj) => {
  // sort by ASC directory/file
  Object.keys(handlerObj).map((uid) => {
    const handler = handlerObj[uid];
    handler.children = handler.children.sort((a, b) => {
      return handlerObj[a].kind === "file" && handlerObj[b].kind === "directory"
        ? 1
        : handlerObj[a].kind === "directory" && handlerObj[b].kind === "file"
        ? -1
        : handlerObj[a].name > handlerObj[b].name
        ? 1
        : -1;
    });
  });
};
export const getInitialFileUidToOpen = (handlerObj: TFileHandlerInfoObj) => {
  let firstHtmlUid: TNodeUid = "",
    indexHtmlUid: TNodeUid = "",
    initialFileUidToOpen: TNodeUid = "";

  // get the index/first html file to be opened by default
  handlerObj[RootNodeUid].children.map((uid) => {
    const handler = handlerObj[uid];
    if (handler.kind === "file" && handler.ext === "html") {
      firstHtmlUid === "" ? (firstHtmlUid = uid) : null;
      handler.name === "index" ? (indexHtmlUid = uid) : null;
    }
  });
  // define the initialFileUidToOpen
  initialFileUidToOpen =
    indexHtmlUid !== ""
      ? indexHtmlUid
      : firstHtmlUid !== ""
      ? firstHtmlUid
      : "";

  return initialFileUidToOpen;
};
export const isUnsavedProject = (fileTree: TFileNodeTreeData) => {
  for (const uid in fileTree) {
    const file = fileTree[uid];
    const fileData = file.data as TFileNodeData;
    if (fileData && fileData.changed) {
      return true;
    }
  }
  return false;
};
export const confirmAlert = (msg: string): boolean => {
  if (!window.confirm(msg)) {
    return false;
  }
  return true;
};
export const confirmFileChanges = (fileTree: TFileNodeTreeData): boolean => {
  return isUnsavedProject(fileTree)
    ? confirmAlert(FileChangeAlertMessage)
    : true;
};
export const getFileNameAndExtensionFromFullname = (
  name: string,
): { baseName: string; ext: string } => {
  const nameArr = name.split(".");
  const ext = nameArr.length > 1 ? (nameArr.pop() as string) : "";
  const baseName = nameArr.join(".");
  return { baseName, ext };
};
export const getNormalizedPath = (
  path: string,
): { isAbsolutePath: boolean; normalizedPath: string } => {
  if (path.startsWith("https://") || path.startsWith("http://")) {
    return { isAbsolutePath: true, normalizedPath: path };
  }
  const isAbsolutePath = _path.isAbsolute(path);
  const normalizedPath = _path.normalize(path);
  return { isAbsolutePath, normalizedPath };
};

export const moveFile = async (
  handler: FileSystemHandle,
  parentHandler: FileSystemDirectoryHandle,
  targetHandler: FileSystemDirectoryHandle,
  newName: string,
  copy: boolean,
  showWarning?: boolean,
  // addMessage?: (message: TToast) => void,
) => {
  // validate if the new name exists
  console.log("move file");

  let exists = true;
  try {
    const handlerExists = await targetHandler.getFileHandle(newName, {
      create: false,
    });
    exists = true;
  } catch (err) {
    exists = false;
  }

  if (exists) {
    showWarning && alert("File with the same name already exists.");
    return;
  }

  // create a new file with the new name and write the content
  try {
    const newFile = await targetHandler.getFileHandle(newName, {
      create: true,
    });

    const content = await (handler as FileSystemFileHandle).getFile();

    const writableStream = await newFile.createWritable();
    await writableStream.write(content);
    await writableStream.close();

    // handle copy(optional)
    !copy &&
      (await parentHandler.removeEntry(handler.name, { recursive: true }));
  } catch (err) {
    throw new Error("error");
  }
};
export const moveLocalFF = async (
  handler: FileSystemHandle,
  parentHandler: FileSystemDirectoryHandle,
  targetHandler: FileSystemDirectoryHandle,
  newName: string,
  copy: boolean = false,
  showWarning: boolean = false,
) => {
  if (handler.kind === "directory") {
    // validate if the new name exists
    let exists = true;
    try {
      await targetHandler.getDirectoryHandle(newName, { create: false });
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      // showWarning &&
      //   addMessage({
      //     type: "error",
      //     content: "Folder with the same name already exists.",
      //   });
      return;
    }

    // move nested handler-dir to targetHandler with the newName - copy (optional)
    try {
      const newHandler = await targetHandler.getDirectoryHandle(newName, {
        create: true,
      });
      await copyDirectory(
        handler as FileSystemDirectoryHandle,
        newHandler,
        copy,
      );
    } catch (err) {
      throw new Error("error");
    }
  } else {
    await moveFile(
      handler,
      parentHandler,
      targetHandler,
      newName,
      copy,
      // showWarning,
      // addMessage,
    );
  }
};

export const moveIDBFF = async (
  nodeData: TFileNodeData,
  targetNodeData: TFileNodeData,
  newName: string,
  copy: boolean = false,
) => {
  if (nodeData.kind === "directory") {
    // validate if the new name exists
    let exists = true;
    try {
      await _getIDBDirectoryOrFileStat(`${targetNodeData.path}/${newName}`);
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      // showWarning &&
      //   addMessage({
      //     type: "error",
      //     content: "Folder with the same name already exists.",
      //   });
      return;
    }

    // move nested handler-dir to targetHandler with the newName - copy (optional)
    try {
      const dirs = [
        {
          orgPath: nodeData.path,
          newPath: `${targetNodeData.path}/${newName}`,
        },
      ];
      for (const { orgPath, newPath } of dirs) {
        await moveDirectory(orgPath, newPath, copy, nodeData);
      }
    } catch (err) {
      throw "error";
    }
  } else {
    // validate if the new name exists
    let exists = true;
    try {
      await _getIDBDirectoryOrFileStat(`${targetNodeData.path}/${newName}`);
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      // showWarning &&
      //   addMessage({
      //     type: "error",
      //     content: "File with the same name already exists.",
      //   });
      return;
    }

    // create a new file with the new name and write the content
    try {
      await _writeIDBFile(
        `${targetNodeData.path}/${newName}`,
        await _readIDBFile(nodeData.path),
      );

      // handle copy(optional)
      !copy && (await _removeIDBDirectoryOrFile(nodeData.path));
    } catch (err) {
      throw "error";
    }
  }
};
