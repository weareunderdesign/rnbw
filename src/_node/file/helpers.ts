import { RootNodeUid } from "@_constants/main";

import {
  TFileHandlerInfoObj,
  TFileNodeData,
  TFileNodeTreeData,
  TNodeUid,
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

export const triggerAlert = (msg: string) => {
  if (!window.confirm(msg)) {
    return;
  }
};
export const triggerFileChangeAlert = () => {
  const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
  triggerAlert(message);
};
export const confirmFileChanges = (fileTree: TFileNodeTreeData) => {
  isUnsavedProject(fileTree) && triggerFileChangeAlert();
};

export const getFileNameAndExtensionFromFullname = (
  name: string,
): { baseName: string; ext: string } => {
  const nameArr = name.split(".");
  const ext = nameArr.length > 1 ? (nameArr.pop() as string) : "";
  const baseName = nameArr.join(".");
  return { baseName, ext };
};
