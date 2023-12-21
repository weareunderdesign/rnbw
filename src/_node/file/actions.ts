import { LogAllow } from "@_constants/global";

import {
  TFileApiPayload,
  TFileHandlerCollection,
  TFileNodeData,
  TFileNodeTreeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
  moveIDBFF,
  moveLocalFF,
} from "../";
import {
  TFileAction,
  TProjectContext,
  setCurrentFileUid,
  setFileAction,
  updateFileTreeViewState,
} from "@_redux/main/fileTree";
import { FileSystemApis } from "./FileSystemApis";
import { TClipboardData, setClipboardData } from "@_redux/main/processor";
import { AnyAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { generateNewNameMoveNode } from "@_components/main/actionsPanel/workspaceTreeView/helpers";
import { verifyFileHandlerPermission } from "@_services/main";

const create = () => {};
const remove = async ({
  projectContext,
  uids,
  fileTree,
  fileHandlers,
}: {
  projectContext: TProjectContext;
  uids: TNodeUid[];
  fileTree: TFileNodeTreeData;
  fileHandlers?: TFileHandlerCollection;
}): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let allDone = true;
      uids.map((uid) => {
        const done = FileSystemApis[projectContext].removeSingleDirectoryOrFile(
          {
            uid,
            fileTree,
            fileHandlers: fileHandlers || {},
          },
        );
        if (!done) allDone = false;
      });
      resolve(allDone);
    } catch (err) {
      reject(err);
    }
  });
};

const move = async ({
  projectContext,
  fileHandlers,
  uids,
  clipboardData,
  fileTree,
  targetNode,
}: {
  projectContext: TProjectContext;
  fileHandlers: any;
  uids: string[];
  clipboardData: TClipboardData | null;
  fileTree: TFileNodeTreeData;
  targetNode: any;
}) => {
  return new Promise<boolean>((resolve, reject) => {
    uids.map(async (uid) => {
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
    });
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
  currentFileUid: string;
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

const rename = ({
  dispatch,
  projectContext,
  fileHandlers,
  fileTree,
  uids,
  newName,
}: {
  dispatch: Dispatch<AnyAction>;
  projectContext: TProjectContext;
  fileHandlers: any;
  fileTree: TFileNodeTreeData;
  uids: TNodeUid[];
  newName: string;
}) => {
  return new Promise<boolean>((resolve, reject) => {
    const renameUid = uids[0];
    const node = fileTree[renameUid];
    if (node === undefined) {
      return false;
    }
    const type = node.data.kind;
    const nodeData = node.data as TFileNodeData;
    const _orgName =
      type === "directory"
        ? `${nodeData.name}`
        : `${nodeData.name}${nodeData.ext}`;

    const _newName = type === "directory" ? `${newName}` : `${newName}`;
    const parentUid = node.parentUid;
    const newUid = `${parentUid}/${_newName}`;

    (async () => {
      if (projectContext === "local") {
        const handler = fileHandlers[renameUid],
          parentHandler = fileHandlers[
            parentUid as TNodeUid
          ] as FileSystemDirectoryHandle;

        if (
          !(await verifyFileHandlerPermission(handler)) ||
          !(await verifyFileHandlerPermission(parentHandler))
        ) {
          return;
        }

        try {
          await moveLocalFF(
            handler,
            parentHandler,
            parentHandler,
            _newName,
            false,
            true,
          );
          await parentHandler.removeEntry(handler.name, { recursive: true });
          resolve(true);
        } catch (err) {
          return;
        }
      } else if (projectContext === "idb") {
        const parentNode = fileTree[parentUid as TNodeUid];
        if (parentNode === undefined) {
          return false;
        }
        const parentNodeData = parentNode.data as TFileNodeData;
        try {
          await moveIDBFF(nodeData, parentNodeData, _newName, false);
          resolve(true);
        } catch (err) {
          return;
        }
      }
    })();

    /* const action: TFileAction = {
      type: "rename",
      param1: { currentFileUid: renameUid, parentUid: parentUid },
      param2: { orgName: _orgName, newName: _newName },
    };
    dispatch(setFileAction(action)); */

    // update redux
    dispatch(setCurrentFileUid(newUid));
    dispatch(updateFileTreeViewState({ convertedUids: [[renameUid, newUid]] }));
  });
};

export const doFileActions = async (
  params: TFileApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  try {
    const {
      projectContext,
      action,
      uids,
      fileTree,
      fileHandlers,
      dispatch,
      currentFileUid,
      nodeTree,
      clipboardData,
      targetNode,
      newName,
    } = params;

    let allDone = true;
    switch (action) {
      case "create":
        create();
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
        cut({
          dispatch,
          uids,
          fileTree,
          currentFileUid,
          nodeTree,
        });
        break;
      case "copy":
        copy({ dispatch, uids, fileTree, currentFileUid, nodeTree });
        break;

      case "move":
        allDone = await move({
          projectContext,
          fileHandlers,
          uids,
          clipboardData,
          fileTree,
          targetNode,
        });
        break;
      case "rename":
        rename({
          dispatch,
          projectContext,
          fileHandlers,
          fileTree,
          uids,
          newName,
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
