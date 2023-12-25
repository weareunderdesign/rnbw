import { LogAllow } from "@_constants/global";
import { TProjectContext } from "@_redux/main/fileTree";

import { TFileHandlerCollection, TFileNodeTreeData, TNodeUid } from "../";
import { FileSystemApis } from "./FileSystemApis";
import { setClipboardData } from "@_redux/main/processor";
import { Dispatch } from "react";
import { AnyAction } from "@reduxjs/toolkit";

const create = async ({
  projectContext,
  fileTree,
  fileHandlers,
  parentUid,
  name,
  kind,
  fb,
  cb,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  parentUid: TNodeUid;
  name: string;
  kind: "file" | "directory";
  fb?: (...params: any[]) => void;
  cb?: (...params: any[]) => void;
}) => {
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
    cb && cb(done);
  } catch (err) {
    LogAllow && console.error(err);
    fb && fb();
  }
};
const remove = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
  fb,
  cb,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  uids: TNodeUid[];
  fb?: (...params: any[]) => void;
  cb?: (...params: any[]) => void;
}) => {
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
    cb && cb(allDone);
  } catch (err) {
    LogAllow && console.error(err);
    fb && fb();
  }
};
const rename = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
  parentUid,
  newName,
  fb,
  cb,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  uids: TNodeUid[];
  parentUid: TNodeUid;
  newName: string;
  fb?: (...params: any[]) => void;
  cb?: (...params: any[]) => void;
}) => {
  try {
    const done = await FileSystemApis[projectContext].moveSingleDirectoryOrFile(
      {
        fileTree,
        fileHandlers,
        uid: uids[0],
        targetUid: parentUid,
        newName,
        isCopy: false,
      },
    );
    cb && cb(done);
  } catch (err) {
    LogAllow && console.error(err);
    fb && fb();
  }
};
const cut = ({
  uids,
  dispatch,
}: {
  uids: TNodeUid[];
  dispatch: Dispatch<AnyAction>;
}) => {
  dispatch(
    setClipboardData({
      panel: "file",
      type: "cut",
      uids,
    }),
  );
};
const copy = ({
  uids,
  dispatch,
}: {
  uids: TNodeUid[];
  dispatch: Dispatch<AnyAction>;
}) => {
  dispatch(
    setClipboardData({
      panel: "file",
      type: "copy",
      uids,
    }),
  );
};
const move = async ({
  projectContext,
  fileTree,
  fileHandlers,
  uids,
  targetUids,
  newNames,
  isCopy,
  fb,
  cb,
}: {
  projectContext: TProjectContext;
  fileTree: TFileNodeTreeData;
  fileHandlers: TFileHandlerCollection;
  uids: TNodeUid[];
  targetUids: TNodeUid[];
  newNames: string[];
  isCopy: boolean;
  fb?: (...params: any[]) => void;
  cb?: (...params: any[]) => void;
}) => {
  try {
    let allDone = true;
    await Promise.all(
      uids.map(async (uid, index) => {
        const done = await FileSystemApis[
          projectContext
        ].moveSingleDirectoryOrFile({
          fileTree,
          fileHandlers,
          uid,
          targetUid: targetUids[index],
          newName: newNames[index],
          isCopy,
        });
        if (!done) allDone = false;
      }),
    );
    cb && cb(allDone);
  } catch (err) {
    LogAllow && console.error(err);
    fb && fb();
  }
};
export const FileActions = {
  create,
  remove,
  rename,
  cut,
  copy,
  move,
};
