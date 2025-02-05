import { FileChangeAlertMessage, RootNodeUid } from "@src/rnbwTSX";
import {
  htmlElementsReferences,
  THtmlElementsReference,
} from "@rnbws/rfrncs.design";
import { THtmlElementsReferenceData } from "@src/types";

import {
  _path,
  TFileHandlerCollection,
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
export const isUnsavedProject = (
  fileTree: TFileNodeTreeData,
  uids?: TNodeUid[],
) => {
  if (uids) {
    for (const uid of uids) {
      const file = fileTree[uid];
      const fileData = file.data as TFileNodeData;
      if (fileData && fileData.changed) {
        return true;
      }
    }
    return false;
  } else {
    for (const uid in fileTree) {
      const file = fileTree[uid];
      const fileData = file.data as TFileNodeData;
      if (fileData && fileData.changed) {
        return true;
      }
    }
    return false;
  }
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
export const getIndexHtmlContent = () => {
  const htmlElementsReferenceData: THtmlElementsReferenceData = {};
  htmlElementsReferences.map((htmlRefElement: THtmlElementsReference) => {
    const pureTag =
      htmlRefElement["Name"] === "Comment"
        ? "comment"
        : htmlRefElement["Tag"]?.slice(1, htmlRefElement["Tag"].length - 1);
    htmlElementsReferenceData[pureTag] = htmlRefElement;
  });

  const doctype = "<!DOCTYPE html>\n";
  const hardcodedHtml = `<html>
  <head>
    <title>Untitled</title>
    <link rel="stylesheet" href="index.css">
    <script src="index.js"></script>
  </head>
  <body>
    <h1>Welcome to Rnbw!</h1>
  </body>
</html>
  `;
  const html = hardcodedHtml;

  const indexHtmlContent = doctype + html;
  return indexHtmlContent;
};
export const getIndexCssContent = () => {
  const css = "body { background-color: #fefefe; }";
  const indexCssContent = css;
  return indexCssContent;
};
export const getIndexJsContent = () => {
  const js = "alert('Welcome to Rnbw!');";
  const indexJsContent = js;
  return indexJsContent;
};
export const getFullnameFromUid = (uid: TNodeUid): string => {
  const uidArr = uid.split(_path.sep);
  return uidArr.pop() || "";
};
export const getParentUidFromUid = (uid: TNodeUid): TNodeUid => {
  const uidArr = uid.split(_path.sep);
  uidArr.pop();
  return uidArr.join(_path.sep);
};
export const getTargetHandler = ({
  fileHandlers,
  targetUid,
  fileTree,
}: {
  targetUid: TNodeUid;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
}) => {
  const targetNode = fileTree[targetUid];
  let targetHandler = null;
  if (targetNode.data.kind === "file" && targetNode.parentUid) {
    targetHandler = fileHandlers[
      targetNode.parentUid
    ] as FileSystemDirectoryHandle;
  } else {
    targetHandler = fileHandlers[targetUid] as FileSystemDirectoryHandle;
  }
  return targetHandler;
};
export const createURLPath = (
  baseString: string,
  partToReplace: string,
  replacementValue: string,
) => {
  return `/${baseString?.replace(partToReplace, replacementValue)}`;
};
