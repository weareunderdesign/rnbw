import { FileChangeAlertMessage, RootNodeUid } from "@_constants/main";

import {
  TFileHandlerInfoObj,
  TFileNodeData,
  TFileNodeTreeData,
  TNodeUid,
  _path,
} from "../";

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
