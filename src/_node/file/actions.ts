import { Dispatch } from "react";

import { LogAllow } from "@_constants/global";
import { TProjectContext } from "@_redux/main/fileTree";
import { setClipboardData, TClipboardData } from "@_redux/main/processor";
import { AnyAction } from "@reduxjs/toolkit";

import {
  TFileApiPayload,
  TFileHandlerCollection,
  TFileNodeTreeData,
  TNodeTreeData,
  TNodeUid,
} from "../";
import { FileSystemApis } from "./FileSystemApis";

const create = async ({
  projectContext,
  fileTree,
  fileHandlers,
  parentUid,
  name,
  kind,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  parentUid: TNodeUid;
  name: string;
  kind: "file" | "directory";
}): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      const done = await FileSystemApis[
        projectContext
      ].createSingleDirectoryOrFile({
        fileTree,
        fileHandlers,
        parentUid,
        name,
        kind,
      });
      resolve(done);
    } catch (err) {
      reject(err);
    }
  });
};
const remove = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  uids: TNodeUid[];
}): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      let allDone = true;
      await Promise.all(
        uids.map(async (uid) => {
          const done = await FileSystemApis[
            projectContext
          ].removeSingleDirectoryOrFile({
            fileTree,
            fileHandlers,
            uid,
          });
          if (!done) allDone = false;
        }),
      );
      resolve(allDone);
    } catch (err) {
      reject(err);
    }
  });
};
const rename = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
  parentUid,
  newName,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  uids: TNodeUid[];
  parentUid: TNodeUid;
  newName: string;
}): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      const done = await FileSystemApis[
        projectContext
      ].moveSingleDirectoryOrFile({
        fileTree,
        fileHandlers,
        uid: uids[0],
        targetUid: parentUid,
        newName,
        isCopy: false,
      });
      resolve(done);
    } catch (err) {
      reject(err);
    }
  });
};

const cut = ({
  dispatch,
  uids,
  fileTree,
  currentFileUid,
  nodeTree,
}: {
  dispatch: Dispatch<AnyAction>;
  uids: TNodeUid[];
  fileTree: TFileNodeTreeData;
  currentFileUid: TNodeUid;
  nodeTree: TNodeTreeData;
}) => {
  dispatch(
    setClipboardData({
      panel: "file",
      type: "cut",
      uids,
      fileType: fileTree[currentFileUid].data.type,
      data: [],
      fileUid: currentFileUid,
      prevNodeTree: nodeTree,
    }),
  );
};
const copy = ({
  dispatch,
  uids,
  fileTree,
  currentFileUid,
  nodeTree,
}: {
  dispatch: Dispatch<AnyAction>;
  uids: TNodeUid[];
  fileTree: TFileNodeTreeData;
  currentFileUid: string;
  nodeTree: TNodeTreeData;
}) => {
  dispatch(
    setClipboardData({
      panel: "file",
      type: "copy",
      uids,
      fileType: fileTree[currentFileUid].data.type,
      data: [],
      fileUid: currentFileUid,
      prevNodeTree: nodeTree,
    }),
  );
};
const move = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
  clipboardData,
  targetNode,
}: {
  projectContext: TProjectContext;
  fileHandlers?: TFileHandlerCollection;
  uids: TNodeUid[];
  clipboardData: TClipboardData | null;
  fileTree: TFileNodeTreeData;
  targetNode: any;
}): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    resolve(true);
    /* uids.map(async (uid) => {
      const node = fileTree[uid];
      if (node === undefined) {
        return false;
      }

      const nodeData = node.data as TFileNodeData;
      const parentNode = fileTree[node.parentUid as TNodeUid];
      if (parentNode === undefined) {
        return false;
      }

      const handler = fileHandlers[uid];

      const parentHandler = fileHandlers[
        parentNode.uid
      ] as FileSystemDirectoryHandle;
      let targetHandler = null;

      if (targetNode.data.kind === "file") {
        targetHandler = fileHandlers[
          targetNode.parentUid
        ] as FileSystemDirectoryHandle;
      } else {
        targetHandler = fileHandlers[
          targetNode.uid
        ] as FileSystemDirectoryHandle;
      }
      if (
        !(await verifyFileHandlerPermission(handler)) ||
        !(await verifyFileHandlerPermission(parentHandler)) ||
        !(await verifyFileHandlerPermission(targetHandler))
      ) {
        return false;
      }
      const newFileName = await generateNewNameMoveNode(
        nodeData,
        targetHandler,
      );

      // move
      try {
        if (projectContext === "local") {
          await moveLocalFF(
            handler,
            parentHandler,
            targetHandler,
            newFileName,
            clipboardData?.type === "copy",
          );
        } else if (projectContext === "idb") {
          const targetNodeData = fileTree[targetNode.uid].data as TFileNodeData;
          await moveIDBFF(
            nodeData,
            targetNodeData,
            newFileName,
            clipboardData?.type === "copy",
          );
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    }); */
  });
};
const duplicate = () => {};

export const doFileActions = async (
  params: TFileApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  try {
    const {
      projectContext,
      action,
      fileTree,
      fileHandlers,

      parentUid,
      name,
      kind,

      uids,

      clipboardData,
      targetNode,
    } = params;

    let allDone = true;
    switch (action) {
      case "create":
        allDone = await create({
          projectContext,
          fileTree,
          fileHandlers,
          parentUid,
          name,
          kind,
        });
        break;
      case "remove":
        allDone = await remove({
          projectContext,
          uids,
          fileTree,
          fileHandlers,
        });
        break;
      case "cut":
        /* cut({
          dispatch,
          uids,
          fileTree,
          currentFileUid,
          nodeTree,
        }); */
        break;
      case "copy":
        // copy({ dispatch, uids, fileTree, currentFileUid, nodeTree });
        break;

      case "move":
        /* allDone = await move({
          projectContext,
          fileHandlers,
          uids,
          clipboardData,
          fileTree,
          targetNode,
        }); */
        break;
      case "rename":
        allDone = await rename({
          projectContext,
          fileTree,
          fileHandlers,
          uids,
          parentUid,
          newName: name,
        });
        break;
      default:
        break;
    }

    cb && cb(allDone);
  } catch (err) {
    LogAllow && console.error(err);
    fb && fb();
  }
};
